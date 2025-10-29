import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Security validation
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

/** ================================
 *  SECURITY CONFIGURATION
 *  ================================ */
const SECURITY_CONFIG = {
  JWT: {
    access: {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
    },
    refresh: {
      expiresIn: '7d',
      issuer: process.env.JWT_ISSUER || 'marketsphere-api',
      audience: process.env.JWT_AUDIENCE || 'marketsphere-app',
    }
  }
};

/** ================================
 *  RATE LIMITING
 *  ================================ */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { 
    error: 'Too many authentication attempts, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** ================================
 *  TOKEN BLACKLIST (IN-MEMORY)
 *  ================================ */
const tokenBlacklist = new Set();

export const addToBlacklist = (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  tokenBlacklist.add(tokenHash);
  
  // Auto cleanup after token expiry (15 minutes)
  setTimeout(() => {
    tokenBlacklist.delete(tokenHash);
  }, 15 * 60 * 1000);
};

export const isTokenBlacklisted = (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenBlacklist.has(tokenHash);
};

/** ================================
 *  TOKEN MANAGEMENT
 *  ================================ */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_SECRET, 
    SECURITY_CONFIG.JWT.access
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
    SECURITY_CONFIG.JWT.refresh
  );
};

export const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh 
    ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh'
    : process.env.JWT_SECRET;

  return jwt.verify(token, secret, {
    issuer: SECURITY_CONFIG.JWT.access.issuer,
    audience: SECURITY_CONFIG.JWT.access.audience,
  });
};

/** ================================
 *  AUTH MIDDLEWARE
 *  ================================ */
export const auth = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Check token blacklist
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        error: 'Token has been invalidated',
        code: 'TOKEN_INVALIDATED'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -otp')
      .lean();

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Account suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Add user info to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/** ================================
 *  ADMIN MIDDLEWARE
 *  ================================ */
export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_USER'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/** ================================
 *  INPUT SANITIZATION
 *  ================================ */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return;
    
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/** ================================
 *  PASSWORD VALIDATION
 *  ================================ */
export const validatePasswordStrength = (password) => {
  const issues = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    issues.push('Password must contain at least one special character');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/** ================================
 *  GOOGLE LOGIN
 *  ================================ */
export const googleLogin = async (token) => {
  if (!token) {
    throw new Error('Google token is required');
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }

  const payload = ticket.getPayload();
  
  if (!payload.email_verified) {
    throw new Error('Google email not verified');
  }

  const { email, name, sub: googleId, picture } = payload;

  let user = await User.findOne({ 
    $or: [
      { email },
      { googleId }
    ]
  });

  const session = await User.startSession();
  let createdUser = false;

  try {
    await session.withTransaction(async () => {
      if (!user) {
        // Generate secure random password
        const randomPassword = crypto.randomBytes(32).toString('hex');
        
        user = await User.create([{
          name: name.trim(),
          email: email.toLowerCase(),
          googleId,
          isVerified: true,
          avatar: picture,
          password: randomPassword,
          lastLogin: new Date(),
          loginCount: 1
        }], { session });

        user = user[0];
        createdUser = true;
      } else {
        // Update existing user
        user.googleId = googleId;
        user.avatar = picture;
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        user.isVerified = true;
        
        await user.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in database
  await User.findByIdAndUpdate(user._id, {
    refreshToken,
    lastActive: new Date()
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: SECURITY_CONFIG.JWT.access.expiresIn
    },
    isNewUser: createdUser
  };
};

/** ================================
 *  TOKEN REFRESH
 *  ================================ */
export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token required');
  }

  const decoded = verifyToken(refreshToken, true);
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.refreshToken !== refreshToken) {
    throw new Error('Refresh token mismatch');
  }

  if (user.isSuspended) {
    throw new Error('Account suspended');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Update refresh token in database
  user.refreshToken = newRefreshToken;
  user.lastActive = new Date();
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: SECURITY_CONFIG.JWT.access.expiresIn
  };
};

/** ================================
 *  LOGOUT
 *  ================================ */
export const logout = async (token, userId) => {
  // Add current token to blacklist
  if (token) {
    addToBlacklist(token);
  }

  // Clear refresh token from database if userId provided
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });
  }
};

export default {
  auth,
  admin,
  googleLogin,
  refreshTokens,
  logout,
  authLimiter,
  generalAuthLimiter,
  sanitizeInput,
  validatePasswordStrength,
  generateAccessToken,
  generateRefreshToken
};
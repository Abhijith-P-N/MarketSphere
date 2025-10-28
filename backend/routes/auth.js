import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { auth } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/** ================================
 *  JWT TOKEN GENERATOR
 *  ================================ */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/** ================================
 *  SEND EMAIL FUNCTION
 *  ================================ */
const sendEmail = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MarketSphere" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    text: message,
  });
};

/** ================================
 *  REGISTER -> SEND OTP
 *  ================================ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    let user = await User.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (user) {
      if (user.isVerified) return res.status(400).json({ message: 'User already exists' });

      user.name = name;
      user.password = password;
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000,
      });
    }

    await sendEmail(
      email,
      'MarketSphere Email Verification Code',
      `Hi ${name},\n\nYour OTP code is ${otp}.\nIt expires in 10 minutes.\n\n- MarketSphere Team`
    );

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

/** ================================
 *  VERIFY OTP
 *  ================================ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'OTP verified successfully',
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    res.status(500).json({ message: 'Server error while verifying OTP' });
  }
});

/** ================================
 *  LOGIN
 *  ================================ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first' });

    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

/** ================================
 *  GOOGLE LOGIN
 *  ================================ */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Google token is required' });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        avatar: picture,
        password: Math.random().toString(36).slice(-8), // temp password
      });
    }

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: jwtToken,
    });
  } catch (error) {
    console.error('GOOGLE LOGIN ERROR:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
});
/** ================================
 *  FORGOT PASSWORD
 *  ================================ */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    // Don't reveal if email exists or not for security
    if (!user) {
      return res.status(200).json({ 
        message: 'If the email exists, a reset link has been sent' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Construct reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail(
      email,
      'MarketSphere - Reset Your Password',
      `Hi ${user.name},\n\nYou requested to reset your password. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- MarketSphere Team`
    );

    res.status(200).json({ 
      message: 'If the email exists, a reset link has been sent' 
    });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Server error while processing request' });
  }
});

/** ================================
 *  RESET PASSWORD
 *  ================================ */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

/** ================================
 *  GET CURRENT USER
 *  ================================ */
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

export default router;

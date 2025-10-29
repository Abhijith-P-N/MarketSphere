import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Security middleware imports (with fallbacks)
let helmet, mongoSanitize, hpp, compression;
try {
  helmet = (await import('helmet')).default;
  mongoSanitize = (await import('express-mongo-sanitize')).default;
  hpp = (await import('hpp')).default;
  compression = (await import('compression')).default;
} catch (error) {
  console.warn('Some security packages not found. Running with basic security.');
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/** ================================
 *  BASIC SECURITY MIDDLEWARE STACK
 *  ================================ */

// Basic security headers (manual implementation if helmet not available)
app.use((req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS Header in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 
}));

// Basic data sanitization against NoSQL injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return;
    
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove MongoDB operators
        if (key.startsWith('$')) {
          delete obj[key];
          continue;
        }
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
});

// Prevent parameter pollution (basic implementation)
app.use((req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    const keys = Object.keys(req.query);
    const uniqueKeys = [...new Set(keys)];
    if (keys.length !== uniqueKeys.length) {
      return res.status(400).json({
        error: 'Parameter pollution detected',
        code: 'PARAMETER_POLLUTION'
      });
    }
  }
  next();
});

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Serve static files with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

/** ================================
 *  ROUTES WITH SECURITY MIDDLEWARE
 *  ================================ */

// Import and apply rate limiters
const { authLimiter, generalAuthLimiter, sanitizeInput, auth } = await import('./middleware/auth.js');

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/', generalAuthLimiter);

// Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/products', sanitizeInput, (await import('./routes/products.js')).default);
app.use('/api/orders', auth, sanitizeInput, (await import('./routes/orders.js')).default);
app.use('/api/users', auth, sanitizeInput, (await import('./routes/users.js')).default);
app.use('/api/upload', auth, (await import('./routes/upload.js')).default);
app.use('/api/images', (await import('./routes/images.js')).default);
app.use('/api/offers', auth, sanitizeInput, (await import('./routes/offers.js')).default);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'MarketSphere API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
  
  res.status(500).json({
    error: error.message,
    stack: error.stack,
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

/** ================================
 *  DATABASE CONNECTION
 *  ================================ */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketsphere';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Closing server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Security features: Basic`);
});
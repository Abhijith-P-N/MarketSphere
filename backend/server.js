import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/products', (await import('./routes/products.js')).default);
app.use('/api/orders', (await import('./routes/orders.js')).default);
app.use('/api/users', (await import('./routes/users.js')).default);
app.use('/api/upload', (await import('./routes/upload.js')).default);
app.use('/api/images', (await import('./routes/images.js')).default);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'MarketSphere API is running!',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketsphere')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});

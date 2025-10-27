import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Image from '../models/Image.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { category, sort, page = 1, limit = 12, search } = req.query;
    
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    let sortOptions = {};
    if (sort === 'price_low') sortOptions.price = 1;
    else if (sort === 'price_high') sortOptions.price = -1;
    else if (sort === 'rating') sortOptions.ratings = -1;
    else sortOptions.createdAt = -1;

    const products = await Product.find(query)
      .populate('images', 'filename originalName mimetype size url')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product with populated images
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('images', 'filename originalName mimetype size url');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { name, description, price, category, stock, images, features, tags } = req.body;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      images: images || [],
      features: features || [],
      tags: tags || [],
      createdBy: req.user._id
    });
    
    await product.save();
    
    await product.populate('images', 'filename originalName mimetype size url');
    
    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { name, description, price, category, stock, images, features, tags } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (stock) updateData.stock = parseInt(stock);
    if (images) updateData.images = images;
    if (features) updateData.features = features;
    if (tags) updateData.tags = tags;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('images', 'filename originalName mimetype size url');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin only) - Also delete associated images
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      await Image.deleteMany({ _id: { $in: product.images } });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = await Review.findOne({
      product: req.params.id,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = new Review({
      user: req.user._id,
      product: req.params.id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    await review.save();

    // Update product ratings
    const reviews = await Review.find({ product: req.params.id });
    product.numOfReviews = reviews.length;
    product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await product.save();

    await review.populate('user', 'name');

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
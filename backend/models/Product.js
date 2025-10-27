import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports & Outdoors', 'Outdoor Gear']
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  ratings: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  features: [String],
  tags: [String]
}, {
  timestamps: true
});

// Virtual for image URLs
productSchema.virtual('imageUrls').get(function() {
  if (this.images && this.images.length > 0) {
    return this.images.map(imageId => `/api/images/${imageId}`);
  }
  return [];
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Product', productSchema);
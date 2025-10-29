import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axios.get(`/api/products/${id}`),
          axios.get(`/api/products/${id}/reviews`)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        
        // Fetch related products after main product data is loaded
        if (productRes.data.category) {
          fetchRelatedProducts(productRes.data.category, productRes.data._id);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProducts = async (category, currentProductId) => {
      setRelatedLoading(true);
      try {
        const response = await axios.get(`/api/products?category=${category}&limit=4`);
        // Filter out the current product from related products
        const filteredProducts = response.data.products.filter(
          product => product._id !== currentProductId
        );
        setRelatedProducts(filteredProducts.slice(0, 3)); // Show max 3 related products
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (!image) return '/api/placeholder/600/600';
    
    if (typeof image === 'string') {
      return `/api/images/${image}`;
    }
    
    // Handle both old format (string URL) and new format (object with _id/url)
    if (image.url) {
      return image.url;
    }
    
    if (image._id) {
      return `/api/images/${image._id}`;
    }
    
    return '/api/placeholder/600/600';
  };

  // Get all image URLs for the product
  const getImageUrls = () => {
    if (!product || !product.images || product.images.length === 0) {
      return ['/api/placeholder/600/600'];
    }
    
    return product.images.map(image => getImageUrl(image));
  };

  // Check if product has valid offer
  const hasValidOffer = (product) => {
    if (!product.offer?.active) return false;
    
    if (product.offer.validUntil) {
      return new Date(product.offer.validUntil) > new Date();
    }
    
    return true;
  };

  // Get current price (offer price if valid, else regular price)
  const getCurrentPrice = (product) => {
    return hasValidOffer(product) && product.offer.offerPrice 
      ? product.offer.offerPrice 
      : product.price;
  };

  // Get original price for display
  const getOriginalPrice = (product) => {
    return product.originalPrice || product.price;
  };

  // Calculate savings amount
  const getSavingsAmount = (product) => {
    if (!hasValidOffer(product)) return 0;
    return getOriginalPrice(product) - getCurrentPrice(product);
  };

  // Get discount percentage
  const getDiscountPercentage = (product) => {
    if (!hasValidOffer(product)) return 0;
    return product.offer.discountPercentage;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (quantity > product.stock) {
      toast.error('Not enough stock available');
      return;
    }
    
    try {
      // Create cart item with current price
      const cartItem = {
        ...product,
        cartPrice: getCurrentPrice(product) // Use current price (could be offer price)
      };
      
      addToCart(cartItem, quantity);
      toast.success('Product added to cart!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      await axios.post(`/api/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted successfully!');
      
      // Refresh product and reviews
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`/api/products/${id}`),
        axios.get(`/api/products/${id}/reviews`)
      ]);
      
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-300 h-96 rounded"></div>
            <div className="space-y-4">
              <div className="bg-gray-300 h-8 rounded w-3/4"></div>
              <div className="bg-gray-300 h-4 rounded w-1/2"></div>
              <div className="bg-gray-300 h-6 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">🌲</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Product Not Found</h2>
        <Link to="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  const imageUrls = getImageUrls();
  const hasOffer = hasValidOffer(product);
  const currentPrice = getCurrentPrice(product);
  const originalPrice = getOriginalPrice(product);
  const savingsAmount = getSavingsAmount(product);
  const discountPercentage = getDiscountPercentage(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link to="/products" className="hover:text-green-600 transition-colors">Products</Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-green-800 font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Images */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-green-100 relative">
            {/* Offer Badge */}
            {hasOffer && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                  {discountPercentage}% OFF
                </span>
              </div>
            )}
            <img
              src={imageUrls[activeImage]}
              alt={product.name}
              className="w-full h-96 object-contain rounded"
              onError={(e) => {
                e.target.src = '/api/placeholder/600/600';
              }}
            />
          </div>
          
          {imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {imageUrls.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`border-2 rounded p-1 transition-colors ${
                    activeImage === index ? 'border-green-500' : 'border-transparent hover:border-green-300'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-contain rounded"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/100/100';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-green-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xl ${
                    i < Math.floor(product.ratings || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="ml-2 text-gray-600">
              {(product.ratings || 0).toFixed(1)} ({product.numOfReviews || 0} reviews)
            </span>
          </div>

          {/* Price Display */}
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl font-bold text-green-700">
                ₹{currentPrice}
              </span>
              {hasOffer && (
                <span className="text-xl text-gray-500 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            
            {hasOffer && (
              <div className="flex items-center space-x-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {discountPercentage}% OFF
                </span>
                <span className="text-green-600 font-semibold">
                  You save ₹{savingsAmount.toFixed(2)}
                </span>
              </div>
            )}
            
            {/* Offer Name */}
            {hasOffer && product.offer.offerName && (
              <p className="text-sm text-red-600 font-medium mt-2">
                🎁 {product.offer.offerName}
              </p>
            )}
            
            {/* Offer Validity */}
            {hasOffer && product.offer.validUntil && (
              <p className="text-xs text-gray-500 mt-1">
                Offer valid until: {new Date(product.offer.validUntil).toLocaleDateString()}
              </p>
            )}
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <span className="text-gray-600 w-32">Category:</span>
              <span className="text-green-700 font-medium capitalize bg-green-50 px-3 py-1 rounded-full text-sm">
                {product.category}
              </span>
            </div>
            
            {product.ecosystem && (
              <div className="flex items-center">
                <span className="text-gray-600 w-32">Ecosystem:</span>
                <span className="text-blue-700 font-medium capitalize bg-blue-50 px-3 py-1 rounded-full text-sm">
                  {product.ecosystem}
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <span className="text-gray-600 w-32">Status:</span>
              <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center">
                <span className="text-gray-600 w-32">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                >
                  {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            
            <Link
              to="/cart"
              className="btn-outline flex items-center justify-center px-6"
            >
              View Cart
            </Link>
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border border-green-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-4 border border-green-100">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Write a Review</h3>
            
            {isAuthenticated ? (
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      rating: parseInt(e.target.value)
                    }))}
                    className="input-field border-green-200 focus:border-green-500"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({
                      ...prev,
                      comment: e.target.value
                    }))}
                    rows="4"
                    className="input-field border-green-200 focus:border-green-500"
                    placeholder="Share your thoughts about this product..."
                    required
                  />
                </div>
                
                <button type="submit" className="btn-primary w-full bg-green-600 hover:bg-green-700">
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3 text-green-600">🔒</div>
                <p className="text-gray-600 mb-4">Please login to write a review</p>
                <Link to="/login" className="btn-primary bg-green-600 hover:bg-green-700">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-semibold text-green-900 mb-6">
            Customer Reviews ({reviews.length})
          </h3>
          
          {reviews.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-100">
              <div className="text-4xl mb-4 text-green-600">💬</div>
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="card p-6 border border-green-100 hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-green-900">{review.user?.name || 'Anonymous'}</h4>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-green-900">Related Products</h2>
          <Link 
            to="/products" 
            className="text-green-600 hover:text-green-700 font-medium flex items-center transition-colors"
          >
            View All Products
            <span className="ml-1">→</span>
          </Link>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="card p-4 animate-pulse">
                <div className="bg-gray-300 h-48 rounded mb-4"></div>
                <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => {
              const hasRelatedOffer = hasValidOffer(relatedProduct);
              const relatedCurrentPrice = getCurrentPrice(relatedProduct);
              const relatedOriginalPrice = getOriginalPrice(relatedProduct);
              
              return (
                <div key={relatedProduct._id} className="card p-4 border border-green-100 hover:shadow-lg transition-all duration-300 hover:border-green-300 group relative">
                  {/* Offer Badge for Related Products */}
                  {hasRelatedOffer && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        {getDiscountPercentage(relatedProduct)}% OFF
                      </span>
                    </div>
                  )}
                  
                  <Link to={`/products/${relatedProduct._id}`} className="block">
                    <div className="relative overflow-hidden rounded-lg mb-4">
                      <img
                        src={getImageUrl(relatedProduct.images?.[0])}
                        alt={relatedProduct.name}
                        className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300';
                        }}
                      />
                      {relatedProduct.stock === 0 && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-green-900 mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    
                    {/* Price Display for Related Products */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-700">
                            ₹{relatedCurrentPrice}
                          </span>
                          {hasRelatedOffer && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{relatedOriginalPrice}
                            </span>
                          )}
                        </div>
                        {hasRelatedOffer && (
                          <span className="text-xs text-red-600 font-semibold">
                            Save ₹{getSavingsAmount(relatedProduct).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-gray-600 text-sm ml-1">
                          {(relatedProduct.ratings || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full capitalize">
                        {relatedProduct.category}
                      </span>
                      {relatedProduct.ecosystem && (
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full capitalize">
                          {relatedProduct.ecosystem}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-green-50 rounded-lg border border-green-100">
            <div className="text-4xl mb-4 text-green-600">🌿</div>
            <p className="text-gray-600">No related products found.</p>
            <Link 
              to="/products" 
              className="inline-block mt-4 btn-primary bg-green-600 hover:bg-green-700"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Animation Variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleLoading, setSaleLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data } = await axios.get('/api/products?limit=8&sort=rating');
        setFeaturedProducts(data?.products || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast.error('Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSaleProducts = async () => {
      try {
        const { data } = await axios.get('/api/offers/active?limit=4'); // Changed to 4 for 4 cards
        setSaleProducts(data || []);
      } catch (error) {
        console.error('Error fetching sale products:', error);
        // Fallback to static data if API fails
        setSaleProducts(getStaticSaleProducts());
      } finally {
        setSaleLoading(false);
      }
    };

    fetchFeaturedProducts();
    fetchSaleProducts();
  }, []);

  // Helper function to check if product has valid offer
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

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (!image) return '/api/placeholder/400/400';
    
    if (typeof image === 'string') {
      return `/api/images/${image}`;
    }
    
    if (image.url) {
      return image.url;
    }
    
    if (image._id) {
      return `/api/images/${image._id}`;
    }
    
    return '/api/placeholder/400/400';
  };

  // Static fallback data for sale products
  const getStaticSaleProducts = () => {
    return [
      {
        _id: '1',
        name: 'Premium Bamboo Toothbrush Set',
        description: 'Eco-friendly bamboo toothbrushes with charcoal-infused bristles for sustainable oral care.',
        price: 899,
        originalPrice: 1299,
        offer: {
          active: true,
          offerPrice: 899,
          discountPercentage: 31,
          validUntil: '2024-12-31'
        },
        images: ['bamboo-toothbrush.jpg']
      },
      {
        _id: '2',
        name: 'Organic Cotton Tote Bag',
        description: 'Stylish and reusable tote bag made from 100% organic cotton, perfect for shopping.',
        price: 599,
        originalPrice: 899,
        offer: {
          active: true,
          offerPrice: 599,
          discountPercentage: 33,
          validUntil: '2024-12-31'
        },
        images: ['cotton-tote.jpg']
      },
      {
        _id: '3',
        name: 'Natural Beeswax Food Wraps',
        description: 'Sustainable alternative to plastic wrap, keeps food fresh with natural beeswax.',
        price: 749,
        originalPrice: 999,
        offer: {
          active: true,
          offerPrice: 749,
          discountPercentage: 25,
          validUntil: '2024-12-31'
        },
        images: ['beeswax-wraps.jpg']
      },
      {
        _id: '4',
        name: 'Recycled Glass Water Bottle',
        description: 'Elegant water bottle made from recycled glass, BPA-free and environmentally friendly.',
        price: 1299,
        originalPrice: 1799,
        offer: {
          active: true,
          offerPrice: 1299,
          discountPercentage: 28,
          validUntil: '2024-12-31'
        },
        images: ['glass-bottle.jpg']
      }
    ];
  };

  const handleSubscribe = () => {
    if (!/\S+@\S+\.\S/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Subscribed successfully! Check your inbox for forest news.');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-blue-50">
      {/* ======================= HERO SECTION ======================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Overlay for darker effect and futuristic glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-blue-900/30 to-purple-900/20"></div>

          {/* Background image */}
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://skipper.org/cdn/shop/articles/eco_friendly_120cd6de-0473-47d2-bbf4-45f526c82391.png?v=1659684410)',
            }}
          ></div>
        </div>

        {/* Hero content */}
        <motion.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          {/* Tagline */}
          <div className="inline-flex items-center space-x-4 mb-6 bg-white/10 backdrop-blur-md rounded-full px-6 py-3">
            <span className="text-lg font-light">
              Sustainable Eco Marketplace
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-serif mb-6 bg-gradient-to-r from-green-200 via-emerald-300 to-amber-200 bg-clip-text text-transparent drop-shadow-xl">
            Verdant
          </h1>

          {/* Subtitle/Description */}
          <p className="text-xl md:text-2xl lg:text-3xl mb-8 text-green-100 font-light max-w-3xl mx-auto leading-relaxed">
            Designed for speed and sustainability, delivering a better experience for you and the planet.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/products"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg px-12 py-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 font-semibold"
            >
              Explore Ecosystems
            </Link>
            <Link
              to="/products?offer=active"
              className="border-2 border-white text-white hover:bg-white hover:text-green-900 text-lg px-12 py-4 rounded-full transition-all duration-300 font-semibold"
            >
              Special Offers
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ======================= ON SALE NOW SECTION ======================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif">
              Limited Time Offers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Exclusive discounts on our premium forest-inspired collections
            </p>
          </div>

          {/* Sale Products Grid - Updated to 4 columns */}
          {saleLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Changed to 4 columns */}
              {[...Array(4)].map((_, index) => ( // Changed to 4 items
                <div key={index} className="bg-white rounded-xl p-6 animate-pulse shadow-sm border border-gray-100 h-full flex flex-col">
                  <div className="bg-gray-200 h-64 rounded-lg mb-6"></div>
                  <div className="bg-gray-200 h-4 rounded mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Changed to 4 columns */}
              {saleProducts.map((product) => {
                const hasOffer = hasValidOffer(product);
                const currentPrice = getCurrentPrice(product);
                const originalPrice = getOriginalPrice(product);
                const savingsAmount = getSavingsAmount(product);
                const discountPercentage = getDiscountPercentage(product);

                return (
                  <div key={product._id} className="flex">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden group w-full">
                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      <Link to={`/product/${product._id}`} className="block relative overflow-hidden bg-gray-50">
                        <img
                          loading="lazy"
                          src={getImageUrl(product.images?.[0])}
                          alt={product.name}
                          className="w-full h-64 object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-600 text-sm mb-4 flex-grow leading-relaxed line-clamp-3">
                          {product.description}
                        </p>
                        
                        {/* Price Display */}
                        <div className="space-y-2 mt-auto">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{currentPrice.toLocaleString('en-IN')}
                            </span>
                            {hasOffer && (
                              <span className="text-lg text-gray-500 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          
                          {hasOffer && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-600">
                                Save ₹{savingsAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/product/${product._id}`}
                          className="inline-flex items-center justify-center w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors duration-300 group/btn"
                        >
                          <span>View Details</span>
                          <span className="ml-2 transform group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View All Offers Button */}
          <div className="text-center mt-12">
            <Link
              to="/products?offer=active"
              className="inline-flex items-center bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 shadow-sm hover:shadow-md group"
            >
              <span>View All Special Offers</span>
              <span className="ml-3 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= FEATURED PRODUCTS SECTION ======================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif">
              Featured Collections
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Curated selection of our most beloved forest-inspired products
            </p>
          </div>

          {/* Products Grid or Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 animate-pulse shadow-sm border border-gray-100"
                >
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const hasOffer = hasValidOffer(product);
                const currentPrice = getCurrentPrice(product);
                const originalPrice = getOriginalPrice(product);
                const discountPercentage = getDiscountPercentage(product);

                return (
                  <div key={product._id}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative group">
                      {/* Offer Badge */}
                      {hasOffer && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
                            {discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                      
                      <Link
                        to={`/product/${product._id}`}
                        className="block relative overflow-hidden bg-gray-50"
                      >
                        <img
                          loading="lazy"
                          src={getImageUrl(product.images?.[0])}
                          alt={product.name}
                          className="w-full h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <div className="p-4 flex flex-col flex-grow">
                        <Link to={`/product/${product._id}`}>
                          <h3 className="font-medium text-gray-900 mb-2 hover:text-green-600 transition-colors duration-300 line-clamp-2 text-sm">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2 flex-grow leading-relaxed">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-semibold text-gray-900">
                                ₹{currentPrice}
                              </span>
                              {hasOffer && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/product/${product._id}`}
                          className="w-full mt-3 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-300"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* "Discover All Treasures" button */}
          <div className="text-center mt-16">
            <Link
              to="/products"
              className="inline-flex items-center bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 shadow-sm hover:shadow-md group"
            >
              <span>View All Products</span>
              <span className="ml-3 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= NEWSLETTER SIGN-UP SECTION ======================= */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
            Stay Connected
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join our newsletter for eco-friendly updates, deals, and new forest collections.
          </p>

          {/* Email input and subscribe button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSubscribe}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 shadow-sm hover:shadow-md"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
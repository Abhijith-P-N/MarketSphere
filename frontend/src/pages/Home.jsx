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
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // This API endpoint assumes you have a backend serving products.
        // Adjust the URL if your backend API is different.
        const { data } = await axios.get('/api/products?limit=8&sort=rating');
        setFeaturedProducts(data?.products || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast.error('Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const handleSubscribe = () => {
    if (!/\S+@\S+\.\S/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    // In a real application, you would typically send this email to your backend
    // for newsletter subscription. For this example, we're just showing a toast.
    toast.success('Subscribed successfully! Check your inbox for forest news.');
    setEmail('');
  };

  // Data for sale items
  const saleProducts = [
    {
      name: 'Handcrafted Pine Desk',
      description: 'Solid wood desk from sustainable pine',
      image: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=500',
      originalPrice: 19999,
      salePrice: 14999,
      link: '/product/pine-desk-sale', // Example link
    },
    {
      name: 'Bamboo Weave Pendant Light',
      description: 'Light up your room with natural bamboo',
      image: 'https://images.unsplash.com/photo-1597854233230-640a455b5120?w=500',
      originalPrice: 4599,
      salePrice: 3299,
      link: '/product/bamboo-light-sale',
    },
    {
      name: 'Autumn Leaf Print Scarf',
      description: 'Warm and cozy scarf for the season',
      image: 'https://images.unsplash.com/photo-1542777173-15748a3c5d6f?w=500',
      originalPrice: 2999,
      salePrice: 1999,
      link: '/product/autumn-scarf-sale',
    },
  ];

  // Data for different forest ecosystems (categories)
  const forestEcosystems = [
    {
      name: 'Bamboo Forest',
      theme: 'bamboo',
      image: 'https://images.unsplash.com/photo-1528433556524-74e7e3bfa599?w=500',
      description: 'Sustainable bamboo products',
      color: 'from-emerald-400 to-green-600',
    },
    {
      name: 'Pine Wilderness',
      theme: 'pine',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500',
      description: 'Evergreen-inspired items',
      color: 'from-blue-500 to-teal-600',
    },
    {
      name: 'Autumn Woods',
      theme: 'autumn',
      image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=500',
      description: 'Warm seasonal collections',
      color: 'from-amber-500 to-orange-600',
    },
    {
      name: 'Tropical Jungle',
      theme: 'jungle',
      image: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=500',
      description: 'Exotic rainforest finds',
      color: 'from-lime-400 to-green-700',
    },
    {
      name: 'Mystical Fog',
      theme: 'foggy',
      image: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=500',
      description: 'Ethereal and mysterious',
      color: 'from-gray-400 to-blue-300',
    },
    {
      name: 'Cherry Blossom',
      theme: 'sakura',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500',
      description: 'Delicate floral beauty',
      color: 'from-pink-300 to-rose-400',
    },
  ];

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
                'url(https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
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
              Sustainable Forest Marketplace
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-serif mb-6 bg-gradient-to-r from-green-200 via-emerald-300 to-amber-200 bg-clip-text text-transparent drop-shadow-xl">
            WildCart
          </h1>

          {/* Subtitle/Description */}
          <p className="text-xl md:text-2xl lg:text-3xl mb-8 text-green-100 font-light max-w-3xl mx-auto leading-relaxed">
            Journey through diverse forest ecosystems. Discover unique treasures
            from bamboo groves to mystical woods.
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
              to="/about"
              className="border-2 border-white text-white hover:bg-white hover:text-green-900 text-lg px-12 py-4 rounded-full transition-all duration-300 font-semibold"
            >
              Our Mission
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ======================= ON SALE NOW SECTION (NEW) ======================= */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-amber-50">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Section Heading */}
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 font-serif">
              On Sale Now
            </h2>
            <p className="text-xl text-green-700 max-w-2xl mx-auto">
              Limited-time offers on our most popular forest-themed goods
            </p>
          </motion.div>

          {/* Collection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {saleProducts.map((product, index) => (
              <motion.div key={index} variants={fadeUp}>
                <div
                  className={`rounded-3xl p-6 bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 h-full flex flex-col`}
                >
                  <img
                    loading="lazy"
                    src={product.image}
                    alt={`Sale item ${product.name}`}
                    className="w-full h-56 object-cover rounded-2xl mb-6 shadow-lg"
                  />
                  <h3 className="text-2xl font-bold text-green-900 font-serif mb-3">
                    {product.name}
                  </h3>
                  <p className="text-green-700 mb-4 flex-grow">
                    {product.description}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-4">
                     <span className="text-3xl font-bold text-red-600">
                      ₹{product.salePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl font-light text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    to={product.link}
                    className="inline-flex items-center text-green-600 hover:text-green-800 font-semibold mt-auto"
                  >
                    View Deal <span className="ml-2">→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ======================= FOREST ECOSYSTEMS SECTION (CATEGORIES) ======================= */}
      <section className="py-20">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }} // Trigger animation when 30% in view
        >
          {/* Section Heading */}
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 font-serif">
              Forest Ecosystems
            </h2>
            <p className="text-xl text-green-700 max-w-2xl mx-auto">
              Explore products inspired by different forest environments around
              the world
            </p>
          </motion.div>

          {/* Ecosystem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forestEcosystems.map((forest, index) => (
              <motion.div key={index} variants={fadeUp}>
                <Link
                  to={`/products?ecosystem=${forest.theme}`}
                  className="group relative h-80 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500 block"
                >
                  <img
                    loading="lazy"
                    src={forest.image}
                    alt={`Scene from ${forest.name} - ${forest.description}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${forest.color} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}
                  ></div>
                  {/* Card Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div>
                      <h3 className="text-2xl font-bold text-white font-serif mb-2 group-hover:translate-x-2 transition-transform duration-300">
                        {forest.name}
                      </h3>
                      <p className="text-green-100 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        {forest.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ======================= FEATURED PRODUCTS SECTION ======================= */}
      <section className="py-20 bg-gradient-to-b from-white to-green-50">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Section Heading */}
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 font-serif">
              Forest Treasures
            </h2>
            <p className="text-xl text-green-700 max-w-2xl mx-auto">
              Handpicked items that capture the essence of wilderness
            </p>
          </motion.div>

          {/* Products Grid or Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-4 animate-pulse shadow-lg"
                >
                  <div className="bg-green-200 h-48 rounded-xl mb-4"></div>
                  <div className="bg-green-200 h-4 rounded mb-2"></div>
                  <div className="bg-green-200 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <motion.div key={product._id} variants={fadeUp}>
                  <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                    <Link
                      to={`/product/${product._id}`}
                      className="block relative overflow-hidden"
                    >
                      <img
                        loading="lazy"
                        src={
                          product.images && product.images.length > 0
                            ? `/api/images/${
                                product.images[0]._id || product.images[0]
                              }`
                            : '/api/placeholder/400/400' // Placeholder if no image exists
                        }
                        alt={product.name}
                        className="w-full h-48 object-contain transition-transform duration-500 hover:scale-110"
                      />
                    </Link>
                    <div className="p-6 flex flex-col flex-grow">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="text-lg font-semibold text-green-900 mb-2 hover:text-green-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-green-700 text-sm mb-4 line-clamp-2 flex-grow">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-2xl font-bold text-amber-600">
                          ₹{product.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* "Discover All Treasures" button */}
          <motion.div className="text-center mt-16" variants={fadeUp}>
            <Link
              to="/products"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-12 py-4 rounded-full text-lg font-semibold inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Discover All Treasures</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ======================= NEWSLETTER SIGN-UP SECTION ======================= */}
      <section className="py-20 bg-gradient-to-t from-green-50 to-amber-50">
        <motion.div
          className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Section Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4 font-serif">
            Stay Connected
          </h2>
          <p className="text-lg text-green-700 mb-8">
            Join our newsletter for eco-friendly updates, deals, and new forest
            collections.
          </p>

          {/* Email input and subscribe button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-2/3 px-6 py-4 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-green-900 placeholder-green-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSubscribe}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Subscribe
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
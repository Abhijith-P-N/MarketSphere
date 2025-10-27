import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const PlaceOrder = () => {
  const { cartItems, getCartTotal, getCartItemsCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // 💡 FIX 1: Define the API_BASE_URL, just like in OrderSuccess.jsx
  const API_BASE_URL = "http://localhost:5000";

  const { selectedAddress, shippingMethod, shippingCost, paymentMethod } = location.state || {};

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08;
  const calculatedShippingCost = shippingCost !== undefined ? shippingCost : (subtotal > 50 ? 0 : 10);
  const total = subtotal + calculatedShippingCost + tax;

  const handleBack = () => {
    navigate('/checkout/payment', {
      state: { selectedAddress, shippingMethod, shippingCost }
    });
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!selectedAddress) {
      toast.error('Shipping address is missing. Please go back.');
      return;
    }
    if (!paymentMethod) {
      toast.error('Payment method is missing. Please go back.');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          // 💡 FIX 2: Changed 'product' to 'productId' to match backend API expectations
          productId: item.product, 
          name: item.name,
          image: item.image,
          price: item.price,
          qty: item.qty
        })),
        shippingAddress: { 
            name: selectedAddress.name,
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            zipCode: selectedAddress.zipCode,
            country: selectedAddress.country
        },
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: calculatedShippingCost,
        totalPrice: total
      };

      // 💡 FIX 1 (continued): Use the full absolute URL
      const { data: order } = await axios.post(`${API_BASE_URL}/api/orders`, orderData);

      clearCart();

      // Navigate to success page
      navigate(`/order/success/${order._id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      let errorMessage = 'Failed to place order. Please try again later.';

      if (error.response) {
        if ((error.response.status === 404 || error.response.status === 400) && error.response.data?.message) {
          // This will now correctly show backend messages like "Not enough stock..."
          errorMessage = error.response.data.message;
        } else if (error.response.data?.message) {
           errorMessage = error.response.data.message;
        } else if (error.response.status === 404) {
          // This is the fallback for the original routing 404
          errorMessage = "Could not connect to API. Please check server."
        }
      }

      toast.error(errorMessage); 
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAddress) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Checkout Information Missing</h2>
        <p className="text-gray-500 mb-8">Please complete all checkout steps first.</p>
        <button onClick={() => navigate('/checkout')} className="btn-primary">
          Back to Checkout
        </button>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) { 
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Cart is Empty</h2>
        <p className="text-gray-500 mb-8">Your cart is empty. Please add items to proceed.</p>
        <Link to="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Progress Steps */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-forest-600 font-semibold">Cart</div>
          </div>
          <div className="w-16 h-1 bg-forest-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-forest-600 font-semibold">Shipping</div>
          </div>
          <div className="w-16 h-1 bg-forest-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">✓</div>
            <div className="ml-2 text-forest-600 font-semibold">Payment</div>
          </div>
          <div className="w-16 h-1 bg-forest-600 mx-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">4</div>
            <div className="ml-2 text-forest-600 font-semibold">Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Review */}
        <div className="lg:col-span-2">
          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Shipping Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Shipping Address</h4>
                <div className="text-gray-600">
                  <p>{selectedAddress.name}</p>
                  <p>{selectedAddress.street}</p>
                  <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                  <p>{selectedAddress.country}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Shipping Method</h4>
                <p className="text-gray-600 capitalize">
                  {shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)'}
                </p>
                <p className="text-wood-600 font-semibold">
                  {calculatedShippingCost === 0 ? 'FREE' : `₹${calculatedShippingCost.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Payment Method</h3>
            <div className="text-gray-600">
              <p className="capitalize">
                {paymentMethod === 'paypal' ? 'PayPal' : 'Credit/Debit Card (Stripe)'}
              </p>
              <p className="text-sm text-gray-500">
                {paymentMethod === 'stripe' ? 'Payment will be processed securely via Stripe' : 'You will be redirected to PayPal upon placing order'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Order Items</h3>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                  <img
                    src={item.image || 'https://placehold.co/100x100/eee/ccc?text=Item'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                     onError={(e) => { e.target.src = 'https://placehold.co/100x100/eee/ccc?text=Item'; }}
                  />
                  <div className="flex-1">
                    <Link 
                      to={`/product/${item.product}`}
                      className="text-lg font-semibold text-forest-800 hover:text-forest-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-gray-600">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-wood-600">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({getCartItemsCount()})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {calculatedShippingCost === 0 ? 'FREE' : `₹${calculatedShippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-forest-800">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-4 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>

            <button
              onClick={handleBack}
              disabled={loading}
              className="w-full border border-forest-600 text-forest-600 hover:bg-forest-50 disabled:opacity-50 py-3 px-4 rounded-lg font-semibold text-center block transition-colors"
            >
              Back to Payment
            </button>

            <div className="mt-4 p-3 bg-forest-50 border border-forest-200 rounded-lg">
              <h4 className="text-sm font-medium text-forest-800 mb-2">By placing your order, you agree to:</h4>
              <ul className="text-xs text-forest-600 space-y-1 list-disc list-inside">
                <li>Our Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Return Policy (30 days)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;

// frontend/src/pages/checkout/Payment.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Payment = () => {
  const { getCartTotal, getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedAddress, shippingMethod, shippingCost } = location.state || {};

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08;
  const total = subtotal + (shippingCost || (subtotal > 50 ? 0 : 10)) + tax;

  const handleContinueToReview = () => {
    if (!selectedAddress) {
      alert('Please complete shipping information first');
      navigate('/checkout');
      return;
    }

    // Proceed to the final review step
    navigate('/checkout/place-order', {
      state: {
        selectedAddress,
        shippingMethod: shippingMethod || 'standard',
        shippingCost: shippingCost || (subtotal > 50 ? 0 : 10),
        paymentMethod: 'Mock Card Payment' // Set the mock payment method
      }
    });
  };

  const handleBack = () => {
    navigate('/checkout/shipping', {
      state: { selectedAddress }
    });
  };

  if (!selectedAddress) {
    // This check remains useful
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2>Shipping Information Missing</h2>
        <p>Please complete shipping information first.</p>
        <button onClick={() => navigate('/checkout')} className="btn-primary">
          Back to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress Bar */}
      {/* ... (progress bar JSX remains the same) ... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Payment Information</h3>
            <div className="bg-forest-50 border-l-4 border-forest-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-forest-800">Mock Payment</h4>
              <p className="text-gray-600 mt-2">
                This is a demo store. No real payment is required. Your order will be automatically confirmed when you place it.
              </p>
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
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
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
              onClick={handleContinueToReview}
              className="w-full btn-primary mb-4"
            >
              Continue to Review
            </button>

            <button
              onClick={handleBack}
              className="w-full btn-outline text-center block"
            >
              Back to Shipping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
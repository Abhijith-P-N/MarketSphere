import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const { cartItems, getCartTotal, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(
    user?.addresses?.find(addr => addr.isDefault) || null
  );

  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleContinueToShipping = () => {
    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }
    navigate('/checkout/shipping', { state: { selectedAddress } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div className="ml-2 text-forest-600 font-semibold">Cart</div>
          </div>
          
          <div className="w-16 h-1 bg-forest-600 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div className="ml-2 text-forest-600 font-semibold">Shipping</div>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div className="ml-2 text-gray-600">Payment</div>
          </div>
          
          <div className="w-16 h-1 bg-gray-300 mx-4"></div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
              4
            </div>
            <div className="ml-2 text-gray-600">Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Details */}
        <div className="lg:col-span-2">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Shipping Address</h3>
            
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAddress?._id === address._id
                        ? 'border-forest-500 bg-forest-50'
                        : 'border-gray-200 hover:border-forest-300'
                    }`}
                    onClick={() => setSelectedAddress(address)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-forest-800">{address.name}</h4>
                        <p className="text-gray-600">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                      </div>
                      {address.isDefault && (
                        <span className="bg-forest-100 text-forest-700 px-2 py-1 rounded text-sm font-medium">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <Link
                  to="/user/addresses"
                  className="inline-flex items-center text-forest-600 hover:text-forest-700 font-semibold transition-colors"
                >
                  + Add New Address
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">🏠</div>
                <p className="text-gray-600 mb-4">No addresses saved yet.</p>
                <Link
                  to="/user/addresses"
                  className="btn-primary"
                >
                  Add Shipping Address
                </Link>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-forest-800 mb-4">Order Items</h3>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product} className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-forest-800">{item.name}</h4>
                    <p className="text-gray-600">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-wood-600">
                      ${(item.price * item.qty).toFixed(2)}
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
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold text-forest-800">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {subtotal < 50 && (
              <div className="bg-forest-50 border border-forest-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-forest-700">
                  Add ${(50 - subtotal).toFixed(2)} more for <strong>FREE shipping</strong>!
                </p>
              </div>
            )}

            <button
              onClick={handleContinueToShipping}
              disabled={!selectedAddress}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-4"
            >
              Continue to Shipping
            </button>

            <Link
              to="/cart"
              className="w-full border border-forest-600 text-forest-600 hover:bg-forest-50 py-3 px-4 rounded-lg font-semibold text-center block transition-colors"
            >
              Back to Cart
            </Link>

            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Secure SSL encryption</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>30-day money back guarantee</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>Free returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
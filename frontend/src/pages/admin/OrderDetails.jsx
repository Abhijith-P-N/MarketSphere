import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');

  // Prevent double-click on action buttons
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('marketsphereToken');
      if (!token) throw new Error('You must be logged in');

      const { data } = await axios.get(`/api/orders/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrder(data);
      setTrackingNumber(data.trackingNumber || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      const msg = error.response?.data?.message || 'Failed to load order details';
      toast.error(msg);

      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      if (actionLoading) return; // prevent rapid clicks
      setActionLoading(true);

      const token = localStorage.getItem('marketsphereToken');
      if (!token) throw new Error('You must be logged in');

      let endpoint = '';
      let data = {};

      switch (status) {
        case 'shipped':
          endpoint = 'ship';
          data = { trackingNumber: trackingNumber || `TRK${Date.now()}` };
          break;
        case 'delivered':
          endpoint = 'deliver';
          break;
        case 'cancelled':
          endpoint = 'cancel';
          break;
        default:
          return;
      }

      await axios.put(`/api/orders/${order._id}/${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Order marked as ${status}`);
      await fetchOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-300 rounded"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-300 rounded"></div>
                <div className="h-64 bg-gray-300 rounded"></div>
                <div className="h-48 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-600">Order Not Found</h2>
          <Link 
            to="/admin/orders" 
            className="inline-flex items-center mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-2">
              Order # {order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
            </p>
          </div>

          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/admin/orders" 
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Orders
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0"
                  >
                    <img 
                      src={item.image || '/api/placeholder/80/80'} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm">Quantity: {item.qty || item.quantity}</p>
                      <p className="text-gray-600 text-sm">
                        {formatPrice(item.price)} × {item.qty || item.quantity} = 
                        {formatPrice(item.price * (item.qty || item.quantity))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(order.itemsPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">{formatPrice(order.shippingPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatPrice(order.taxPrice)}</span>
                </div>

                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-green-700">{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Information</h2>

              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 text-sm">Name:</span>
                  <p className="font-medium">{order.user?.name || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Email:</span>
                  <p className="font-medium">{order.user?.email || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">User ID:</span>
                  <p className="font-medium text-sm">{order.user?._id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>

              <div className="space-y-3">
                {order.shippingAddress ? (
                  <>
                    <div>
                      <span className="text-gray-600 text-sm">Full Name:</span>
                      <p className="font-medium">{order.shippingAddress.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Address:</span>
                      <p className="font-medium">
                        {order.shippingAddress.street || order.shippingAddress.address}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">City:</span>
                      <p className="font-medium">{order.shippingAddress.city}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">State:</span>
                      <p className="font-medium">{order.shippingAddress.state}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Postal Code:</span>
                      <p className="font-medium">{order.shippingAddress.postalCode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Country:</span>
                      <p className="font-medium">{order.shippingAddress.country}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Phone:</span>
                      <p className="font-medium">{order.shippingAddress.phone}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">No shipping address provided</p>
                )}

                {order.trackingNumber && (
                  <div>
                    <span className="text-gray-600 text-sm">Tracking Number:</span>
                    <p className="font-medium">{order.trackingNumber}</p>
                  </div>
                )}

                {order.shippedAt && (
                  <div>
                    <span className="text-gray-600 text-sm">Shipped At:</span>
                    <p className="font-medium">{formatDate(order.shippedAt)}</p>
                  </div>
                )}

                {order.deliveredAt && (
                  <div>
                    <span className="text-gray-600 text-sm">Delivered At:</span>
                    <p className="font-medium">{formatDate(order.deliveredAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Actions</h2>

              {/* Tracking Number Input */}
              {order.status === 'processing' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                    focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-3">
                {order.status === 'processing' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus('shipped')}
                      disabled={actionLoading}
                      className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md 
                        hover:bg-blue-700 transition duration-200 
                        ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading ? 'Processing...' : 'Mark as Shipped'}
                    </button>

                    <button
                      onClick={() => updateOrderStatus('cancelled')}
                      disabled={actionLoading}
                      className={`w-full bg-red-600 text-white py-2 px-4 rounded-md 
                        hover:bg-red-700 transition duration-200 
                        ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading ? 'Processing...' : 'Cancel Order'}
                    </button> 
                  </>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={actionLoading}
                    className={`w-full bg-green-600 text-white py-2 px-4 rounded-md 
                      hover:bg-green-700 transition duration-200 
                      ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {actionLoading ? 'Processing...' : 'Mark as Delivered'}
                  </button>
                )}

                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <p className="text-center text-gray-500 py-2">
                    No actions available for {order.status} orders
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;

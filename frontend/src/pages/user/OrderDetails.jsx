import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('marketsphereToken');
      if (!token) throw new Error('You must be logged in');

      const { data } = await axios.get(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      const msg = error.response?.data?.message || 'Failed to load order details';
      toast.error(msg);

      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/user/orders'); // redirect user if unauthorized
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <p className="text-center py-8">Loading order details...</p>;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-600">Order Not Found</h2>
        <Link to="/user/orders" className="btn-primary mt-4">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest-800">Order Details</h1>
          <p className="text-gray-600 mt-2">
            Order # {order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.orderItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-lg font-semibold text-forest-800">{item.name}</p>
                <p className="text-gray-600">Qty: {item.qty}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-wood-600">
                  ₹{(item.price * item.qty).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">${item.price} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Shipping Address</h2>
        <div className="text-gray-700">
          <p className="font-semibold">{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Order Summary</h2>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Items ({order.orderItems.reduce((sum, item) => sum + item.qty, 0)})</span>
          <span>₹{order.itemsPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Shipping</span>
          <span>₹{order.shippingPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Tax</span>
          <span>₹{order.taxPrice.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-semibold text-forest-800">
          <span>Total</span>
          <span>₹{order.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <Link
        to="/user/orders"
        className="w-full bg-forest-600 hover:bg-forest-700 text-white py-3 px-4 rounded-lg font-semibold text-center block mt-6 transition-colors"
      >
        Back to Orders
      </Link>
    </div>
  );
};

export default OrderDetails;

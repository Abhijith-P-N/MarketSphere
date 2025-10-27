import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [],
    features: [''],
    tags: ['']
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports & Outdoors', 'Outdoor Gear'];

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id, isEditing]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/products/${id}`);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price || '',
        category: data.category || '',
        stock: data.stock || '',
        images: data.images || [],
        features: data.features && data.features.length > 0 ? data.features : [''],
        tags: data.tags && data.tags.length > 0 ? data.tags : ['']
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('images', file);
      });

      const { data } = await axios.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const uploadedImages = data.files || data;
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
      
      toast.success(`Successfully uploaded ${files.length} image(s)`);
      
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload images';
      toast.error(errorMessage);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = async (imageId, index) => {
    try {
      if (imageId && typeof imageId === 'object') {
        imageId = imageId._id;
      }
      
      if (imageId) {
        await axios.delete(`/api/images/${imageId}`);
      }
      
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      
      toast.success('Image removed');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Product name is required');
        setSaving(false);
        return;
      }

      if (!formData.description.trim()) {
        toast.error('Product description is required');
        setSaving(false);
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Valid price is required');
        setSaving(false);
        return;
      }

      if (!formData.category) {
        toast.error('Category is required');
        setSaving(false);
        return;
      }

      if (!formData.stock || parseInt(formData.stock) < 0) {
        toast.error('Valid stock quantity is required');
        setSaving(false);
        return;
      }

      // Extract image IDs and prepare data
      const imageIds = formData.images.map(img => {
        if (typeof img === 'string') return img;
        return img._id;
      });

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        images: imageIds,
        features: formData.features.filter(feature => feature.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };

      let response;
      if (isEditing) {
        response = await axios.put(`/api/products/${id}`, submitData);
        toast.success('Product updated successfully');
      } else {
        response = await axios.post('/api/products', submitData);
        toast.success('Product created successfully');
      }

      // Navigate back to products list
      navigate('/admin/products');
      
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (typeof image === 'string') {
      return `/api/images/${image}`;
    }
    return image.url || `/api/images/${image._id}`;
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/admin/products');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update product information' : 'Create a new product for your store'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-green-100">
        {/* Basic Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-green-900 mb-4 border-b border-green-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field border-green-200 focus:border-green-500"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field border-green-200 focus:border-green-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price * ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className="input-field border-green-200 focus:border-green-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="input-field border-green-200 focus:border-green-500"
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="input-field border-green-200 focus:border-green-500"
              placeholder="Enter detailed product description..."
              required
            />
          </div>
        </div>

        {/* Images */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-green-900 mb-4 border-b border-green-200 pb-2">
            Product Images
          </h3>
          
          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Max 5 images, 5MB each)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="input-field border-green-200"
              disabled={imageUploading || formData.images.length >= 5}
            />
            {imageUploading && (
              <div className="flex items-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                <p className="text-sm text-green-600">Uploading images...</p>
              </div>
            )}
            {formData.images.length >= 5 && (
              <p className="text-sm text-yellow-600 mt-2">Maximum 5 images reached</p>
            )}
          </div>

          {/* Image Preview */}
          {formData.images.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Images ({formData.images.length}/5)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {formData.images.map((image, index) => (
                  <div key={image._id || index} className="relative group">
                    <img
                      src={getImageUrl(image)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-green-200 group-hover:border-green-400 transition-colors"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/100/100';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image, index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs p-1 text-center rounded-b-lg">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.images.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
              <div className="text-4xl mb-2 text-green-600">📷</div>
              <p className="text-gray-500">No images uploaded yet</p>
              <p className="text-sm text-gray-400">Upload product images to display here</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-900 border-b border-green-200 pb-2">Features</h3>
            <button
              type="button"
              onClick={() => addArrayField('features')}
              className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <span className="mr-1">+</span> Add Feature
            </button>
          </div>
          
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-3">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleArrayChange('features', index, e.target.value)}
                placeholder="Enter a feature (e.g., Waterproof, Eco-friendly)"
                className="input-field border-green-200 focus:border-green-500 flex-1"
              />
              {formData.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('features', index)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          {formData.features.length === 0 && (
            <p className="text-gray-500 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              No features added yet. Click "Add Feature" to get started.
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-900 border-b border-green-200 pb-2">Tags</h3>
            <button
              type="button"
              onClick={() => addArrayField('tags')}
              className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <span className="mr-1">+</span> Add Tag
            </button>
          </div>
          
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2 mb-3">
              <input
                type="text"
                value={tag}
                onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                placeholder="Enter a tag (e.g., outdoor, eco-friendly)"
                className="input-field border-green-200 focus:border-green-500 flex-1"
              />
              {formData.tags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('tags', index)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          {formData.tags.length === 0 && (
            <p className="text-gray-500 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              No tags added yet. Click "Add Tag" to get started.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-green-200">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating Product...' : 'Creating Product...'}
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                {isEditing ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 py-3 px-6 rounded-lg font-semibold transition-colors text-center shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
        </div>

        {/* Required Fields Note */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center">
            <span className="mr-2">📝</span>
            <strong>Note:</strong> Fields marked with * are required.
          </p>
        </div>
      </form>

      {/* Product Preview */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-green-100">
        <h3 className="text-xl font-semibold text-green-900 mb-4 border-b border-green-200 pb-2">
          Product Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {formData.images.length > 0 ? (
              <img
                src={getImageUrl(formData.images[0])}
                alt="Product preview"
                className="w-full h-48 object-cover rounded-lg border border-green-200"
                onError={(e) => {
                  e.target.src = '/api/placeholder/300/300';
                }}
              />
            ) : (
              <div className="w-full h-48 bg-green-50 rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                <span className="text-green-600">No image preview</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-green-900 mb-2">
              {formData.name || 'Product Name'}
            </h4>
            <p className="text-green-700 text-xl font-bold mb-2">
              ${formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
            </p>
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">Category:</span> {formData.category || 'Not selected'}
            </p>
            <p className="text-gray-600 text-sm mb-4">
              <span className="font-medium">Stock:</span> {formData.stock || '0'} units
            </p>
            {formData.features.filter(f => f.trim()).length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {formData.features.filter(f => f.trim()).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {formData.tags.filter(t => t.trim()).length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Tags:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.filter(t => t.trim()).map((tag, index) => (
                    <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductEdit;
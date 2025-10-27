import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'LOGIN_FAIL':
      return { ...state, loading: false, user: null, isAuthenticated: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for stored token
  useEffect(() => {
    const token = localStorage.getItem('marketsphereToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getUserProfile();
    }
  }, []);

  const getUserProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    } catch {
      localStorage.removeItem('marketsphereToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('marketsphereToken', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      toast.success(data.message);
      dispatch({ type: 'LOGIN_SUCCESS', payload: null });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const verifyOtp = async (email, otp) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { email, otp });
      localStorage.setItem('marketsphereToken', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/google', { token: googleToken });
      localStorage.setItem('marketsphereToken', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('marketsphereToken');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });
  const updateUser = (userData) => dispatch({ type: 'UPDATE_USER', payload: userData });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verifyOtp,
        loginWithGoogle,
        logout,
        clearError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

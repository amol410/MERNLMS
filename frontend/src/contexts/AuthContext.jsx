import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveAuth = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}! 🐬`);
      return { success: true };
    } catch (error) {
      const errData = error.response?.data;
      const msg = errData?.message || 'Login failed';
      // If unverified account, pass back requireVerification and email so UI can prompt for OTP
      if (errData?.requireVerification) {
        toast.error(msg);
        return { success: false, requireVerification: true, email: errData.email || email, message: msg };
      }
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      if (data.requireVerification) {
        toast.success(data.message || 'Verification code sent to your email! ✉️');
        return { success: true, requireVerification: true, email: data.email || email, message: data.message };
      }
      if (data.token && data.user) {
        saveAuth(data.token, data.user);
        toast.success(`Welcome to DolphinCoder LMS, ${data.user.name}! 🎉`);
      }
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyRegistrationOtp = useCallback(async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-registration-otp', { email, otp });
      if (data.token && data.user) {
        saveAuth(data.token, data.user);
        toast.success(`Welcome to DolphinCoder LMS, ${data.user.name}! 🎉`);
        return { success: true, user: data.user, token: data.token };
      }
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired verification code';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resendRegistrationOtp = useCallback(async (email) => {
    try {
      const { data } = await api.post('/auth/resend-registration-otp', { email });
      toast.success(data.message || 'Fresh verification code sent! ✉️');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend code';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyRegistrationOtp,
      resendRegistrationOtp,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;

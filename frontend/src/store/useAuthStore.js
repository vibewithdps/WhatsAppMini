import { create } from 'zustand';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('wa_user') || 'null'),
  accessToken: localStorage.getItem('wa_access_token') || null,
  isLoading: false,
  error: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('wa_user', JSON.stringify(user));
    localStorage.setItem('wa_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('wa_refresh_token', refreshToken);
    }
    set({ user, accessToken, error: null });
    initSocket(user);
  },

  demoLogin: async (profile = 'alice') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/demo-login', { profile });
      const { user, accessToken, refreshToken } = res.data;
      get().setAuth(user, accessToken, refreshToken);
      set({ isLoading: false });
      return user;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Demo login failed',
      });
      throw err;
    }
  },

  sendOTP: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/send-otp', payload);
      // Save email in local variable to use in verifyOTP
      window.lastUsedEmail = payload.email;
      window.hasName = res.data.hasName;
      window.existingName = res.data.existingName;
      set({ isLoading: false });
      
      if (res.data._dev_otp) {
        alert("Email Server Timeout. Auto-fetched OTP: " + res.data._dev_otp);
        window._dev_otp = res.data._dev_otp;
      }
      return res.data;
  
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to send OTP via Email',
      });
      throw err;
    }
  },

  verifyOTP: async ({ identifier, otp, name, avatar }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', {
        phone: identifier,
        email: window.lastUsedEmail,
        otp,
        name,
        avatar
      });
      
      const { user: dbUser, accessToken, refreshToken } = res.data;
      get().setAuth(dbUser, accessToken, refreshToken);
      
      set({ isLoading: false });
      return dbUser;
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Invalid OTP',
      });
      throw err;
    }
  },

    updateAccount: async (data) => {
    try {
      const response = await api.put('/users/account', data);
      set({ user: response.data });
      return { success: true };
    } catch (error) {
      console.error('Update account failed:', error);
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
  },

  updateProfile: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await api.put('/auth/profile', formData);
      const updatedUser = res.data.user;
      localStorage.setItem('wa_user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('wa_user');
    localStorage.removeItem('wa_access_token');
    localStorage.removeItem('wa_refresh_token');
    disconnectSocket();
    set({ user: null, accessToken: null, error: null });
  },
}));

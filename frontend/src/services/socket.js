import { io } from 'socket.io-client';

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? window.location.origin
    : `http://${window.location.hostname}:5000`);

let socket = null;

export const initSocket = (user) => {
  if (!socket && user) {
    socket = io(BACKEND_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io Connected:', socket.id);
      socket.emit('setup', user);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

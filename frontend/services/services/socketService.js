import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.89:3000';

let socket = null;

export const connectSocket = () => {
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinUserRoom = (userId) => {
  if (socket) socket.emit('join', { userId });
};

export const joinStoreRoom = (storeId) => {
  if (socket) socket.emit('joinStore', { storeId });
};

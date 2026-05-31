import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

export const useSocket = (documentId, handlers = {}) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!documentId || !token) return;

    // Connect to socket server with auth payload
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const handleJoin = () => {
      console.log('Socket Connected to Server, joining document:', documentId);
      newSocket.emit('document:join', { documentId });
    };

    if (newSocket.connected) {
      handleJoin();
    } else {
      newSocket.on('connect', handleJoin);
    }

    newSocket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    // Register dynamic event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      newSocket.on(event, handler);
    });

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('document:leave');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, token]);

  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return { socket, emit };
};

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('Intentando conectar Socket.io a:', socketUrl);
    
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io conectado! ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Error de conexión Socket.io:', err.message);
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
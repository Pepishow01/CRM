import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      {
        path: '/socket.io',
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      },
    );
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  s.auth = { token };
  s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
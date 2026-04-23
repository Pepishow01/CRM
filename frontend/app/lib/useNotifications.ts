'use client';
import { useEffect } from 'react';
import { getSocket } from './socket';

let permissionRequested = false;

export function useNotifications(activeChatId?: string | null) {
  useEffect(() => {
    // Request permission once
    if (!permissionRequested && typeof window !== 'undefined' && 'Notification' in window) {
      permissionRequested = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const socket = getSocket();

    function handleNewMessage(data: any) {
      // Only notify for inbound messages and when the chat is not the active one
      if (data.message?.direction !== 'inbound') return;
      if (data.chatId === activeChatId) return;
      if (typeof window !== 'undefined' && document.hasFocus()) return;

      if (Notification.permission === 'granted') {
        const contactName = data.contact?.fullName || 'Contacto';
        const preview = data.message?.content?.slice(0, 80) || 'Nuevo mensaje';
        const notif = new Notification(`💬 ${contactName}`, {
          body: preview,
          icon: '/favicon.ico',
          tag: data.chatId, // Replace previous notification from same chat
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    }

    socket.on('chat:new-message', handleNewMessage);
    return () => { socket.off('chat:new-message', handleNewMessage); };
  }, [activeChatId]);
}

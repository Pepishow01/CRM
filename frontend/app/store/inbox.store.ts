import { create } from 'zustand';

export type LeadStatus = 'new' | 'in_progress' | 'waiting' | 'sold' | 'lost';
export type Channel = 'whatsapp' | 'instagram' | 'messenger';

export interface Contact {
  id: string;
  fullName: string;
  whatsappPhone?: string;
  instagramId?: string;
  messengerId?: string;
  avatarUrl?: string;
  travelData?: Record<string, any>;
}

export interface Chat {
  id: string;
  contact: Contact;
  channel: Channel;
  status: LeadStatus;
  aiClassification?: string;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  assignedTo?: { id: string; fullName: string } | null;
}

export interface Message {
  id: string;
  chatId: string;
  direction: 'inbound' | 'outbound';
  contentType: string;
  content: string;
  mediaUrl?: string;
  sentAt: string;
  sender?: { id: string; fullName: string } | null;
}

interface InboxState {
  chats: Chat[];
  activeChatId: string | null;
  isLoadingChats: boolean;
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  statusFilter: LeadStatus | 'all';
  searchQuery: string;

  setChats: (chats: Chat[]) => void;
  setActiveChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  bumpChat: (chatId: string, preview: string, timestamp: string) => void;
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;
  setStatusFilter: (status: LeadStatus | 'all') => void;
  setSearchQuery: (q: string) => void;
  filteredChats: () => Chat[];
}

export const useInboxStore = create<InboxState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isLoadingChats: false,
  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: true,
  statusFilter: 'all',
  searchQuery: '',

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id, messages: [], hasMoreMessages: true }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateChat: (chatId, updates) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
    })),

  bumpChat: (chatId, preview, timestamp) =>
    set((s) => {
      const chat = s.chats.find((c) => c.id === chatId);
      if (!chat) return s;
      const updatedChat = {
        ...chat,
        lastMessagePreview: preview,
        lastMessageAt: timestamp,
      };
      const otherChats = s.chats.filter((c) => c.id !== chatId);
      return { chats: [updatedChat, ...otherChats] };
    }),

  incrementUnread: (chatId) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: c.unreadCount + 1 } : c
      ),
    })),

  clearUnread: (chatId) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    })),

  setStatusFilter: (status) => set({ statusFilter: status }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  filteredChats: () => {
    const { chats, statusFilter, searchQuery } = get();
    return chats.filter((chat) => {
      const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
      const matchesSearch =
        chat.contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  },
}));
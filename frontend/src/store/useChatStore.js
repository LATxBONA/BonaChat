import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {}, // Lưu số lượng tin nhắn chưa đọc

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
  
    const playNotificationSound = () => {
      const audio = new Audio("/sounds/Windows Pop-up Blocked.wav");
      audio.play().catch((err) => console.error("Error playing sound:", err));
    };
  
    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const isMessageSentFromSelectedUser = 
        newMessage.senderId === selectedUser?._id;
  
      set((state) => {
        let updatedMessages = state.messages;
        let updatedUnreadCounts = { ...state.unreadCounts };
  
        if (isMessageSentFromSelectedUser) {
          // If user is currently chatting with sender, add message to list
          updatedMessages = [...state.messages, newMessage];
          
          // Mark as read immediately
          axiosInstance.put("/messages/mark-read", { 
            senderId: newMessage.senderId 
          }).catch(err => console.error("Error marking as read:", err));
        } else {
          // If user is NOT chatting with sender, increase unread count
          updatedUnreadCounts[newMessage.senderId] =
            (updatedUnreadCounts[newMessage.senderId] || 0) + 1;
          playNotificationSound();
        }
  
        return {
          messages: updatedMessages,
          unreadCounts: updatedUnreadCounts,
        };
      });
    });

    socket.on("messagesRead", ({ senderId, receiverId }) => {
      const authUser = useAuthStore.getState().authUser;
      if (receiverId === authUser._id) {
        // Người dùng đã đọc tin nhắn, cập nhật lại số tin chưa đọc
        set((state) => {
          const updatedCounts = { ...state.unreadCounts };
          delete updatedCounts[senderId];
          return { unreadCounts: updatedCounts };
        });
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-count");
      const unreadData = res.data.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      set({ unreadCounts: unreadData });
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put("/messages/mark-read", { senderId });
      set((state) => {
        const updatedCounts = { ...state.unreadCounts };
        delete updatedCounts[senderId];
        return { unreadCounts: updatedCounts };
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },
}));

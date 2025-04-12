"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL, SOCKET_URL } from '@/config/environment';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket with auth token
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Handle user status updates
    newSocket.on('userStatus', (activeUserIds) => {
      setOnlineUsers(activeUserIds);
    });

    // Handle new messages
    newSocket.on('newMessage', (message) => {
      // Add message to messages if in current conversation
      if (currentConversation && currentConversation._id && message.conversation &&
          message.conversation.toString() === currentConversation._id.toString()) {
        setMessages(prev => [...prev, message]);

        // Mark as read immediately if we're in the conversation
        newSocket.emit('markAsRead', { messageId: message._id });
      }

      // Update conversations list
      updateConversationWithMessage(message);
    });

    // Handle message sent confirmation
    newSocket.on('messageSent', (message) => {
      // Check if this message has a tempId (was sent by this client)
      const hasTempId = message.tempId !== undefined;

      // Add or replace message in messages if in current conversation
      if (currentConversation && currentConversation._id && message.conversation &&
          message.conversation.toString() === currentConversation._id.toString()) {

        setMessages(prev => {
          if (hasTempId) {
            // Replace temp message with real one
            return prev.map(msg =>
              msg.isTemp && msg._id === message.tempId ?
                { ...message, status: 'sent' } : msg
            );
          } else {
            // Just add the message if it wasn't sent by this client
            return [...prev, message];
          }
        });
      }

      // Update conversations list
      updateConversationWithMessage(message);
    });

    // Handle message read status
    newSocket.on('messageRead', ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id && messageId && msg._id.toString() === messageId.toString()
            ? { ...msg, isRead: true, readAt: new Date() }
            : msg
        )
      );
    });

    // Handle typing indicators
    newSocket.on('userTyping', ({ userId, typing }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: typing
      }));

      // Clear typing indicator after 3 seconds if no updates
      if (typing) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    });

    // Handle chat requests (for doctors)
    newSocket.on('chatRequest', (request) => {
      setPendingRequests(prev => [request, ...prev]);
      toast.info(`New chat request from ${request.patient.firstName} ${request.patient.lastName}`);
    });

    // Handle pending chat requests (for doctors)
    newSocket.on('pendingChatRequests', (requests) => {
      setPendingRequests(requests);
    });

    // Handle request responses (for patients)
    newSocket.on('requestResponse', (response) => {
      setRequestStatus(prev => ({
        ...prev,
        [response.conversationId]: response.status
      }));

      if (response.message) {
        toast.info(response.message);
      }
    });

    // Handle request status updates (for patients)
    newSocket.on('requestStatusUpdate', (update) => {
      setRequestStatus(prev => ({
        ...prev,
        [update.conversationId]: update.status
      }));

      if (update.status === 'accepted') {
        toast.success('Doctor accepted your chat request!');
        fetchConversations(); // Refresh conversations list
      } else if (update.status === 'rejected') {
        toast.error('Doctor rejected your chat request.');
      }
    });

    // Handle response confirmations (for doctors)
    newSocket.on('responseConfirmation', (confirmation) => {
      // Remove the request from pending requests
      setPendingRequests(prev =>
        prev.filter(req => req.conversationId.toString() !== confirmation.conversationId.toString())
      );

      if (confirmation.status === 'accepted') {
        fetchConversations(); // Refresh conversations list
        toast.success('You accepted the chat request');
      } else {
        toast.info('You rejected the chat request');
      }
    });

    // Set socket in state
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Helper function to update conversations list with a new message
  const updateConversationWithMessage = useCallback((message) => {
    setConversations(prev => {
      // Find if conversation exists
      const conversationIndex = prev.findIndex(
        conv => conv._id && message.conversation &&
        conv._id.toString() === message.conversation.toString()
      );

      if (conversationIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        const conversation = { ...updatedConversations[conversationIndex] };

        // Update last message
        conversation.lastMessage = message;

        // Update unread count ONLY if message is from OTHER user (not from current user)
        if (user && user.id && message.sender._id.toString() !== user.id.toString()) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Update timestamp
        conversation.updatedAt = message.createdAt;

        // Replace conversation in array
        updatedConversations[conversationIndex] = conversation;

        // Sort conversations by latest message
        return updatedConversations.sort((a, b) =>
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      } else {
        // This is a new conversation, fetch all conversations
        fetchConversations();
        return prev;
      }
    });
  }, [user]);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!isAuthenticated || !conversationId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/messages/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setMessages(response.data.data);

        // Update unread count in conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Request a conversation with a doctor (for patients)
  const requestConversation = useCallback(async (doctorId) => {
    if (!isAuthenticated || !doctorId || user?.role !== 'patient') return;

    // Try to use socket first
    if (socket && connected) {
      socket.emit('requestChat', { doctorId });
      return true;
    }

    // Fallback to HTTP
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/messages/conversations/request`,
        { doctorId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const conversation = response.data.data;

        // Update request status
        setRequestStatus(prev => ({
          ...prev,
          [conversation._id]: conversation.status
        }));

        if (conversation.status === 'accepted') {
          // If already accepted, add to conversations and set as current
          const exists = conversations.some(conv => conv._id === conversation._id);

          if (!exists) {
            setConversations(prev => [conversation, ...prev]);
          }

          setCurrentConversation(conversation);
          fetchMessages(conversation._id);
        }

        toast.info(response.data.message || 'Chat request sent');
        return true;
      }
    } catch (error) {
      console.error('Error requesting conversation:', error);
      toast.error('Failed to request conversation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, socket, connected, conversations, fetchMessages]);

  // Respond to a conversation request (for doctors)
  const respondToRequest = useCallback((conversationId, status) => {
    if (!isAuthenticated || !conversationId || user?.role !== 'doctor') return false;
    if (!status || !['accepted', 'rejected'].includes(status)) return false;

    // Try to use socket first
    if (socket && connected) {
      socket.emit('respondToRequest', { conversationId, status });
      return true;
    }

    // Fallback to HTTP
    return (async () => {
      try {
        const response = await axios.patch(
          `${API_URL}/messages/conversations/${conversationId}/respond`,
          { status },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          // Remove from pending requests
          setPendingRequests(prev =>
            prev.filter(req => req.conversationId.toString() !== conversationId.toString())
          );

          if (status === 'accepted') {
            // Refresh conversations list
            fetchConversations();
            toast.success('You accepted the chat request');
          } else {
            toast.info('You rejected the chat request');
          }

          return true;
        }
      } catch (error) {
        console.error('Error responding to request:', error);
        toast.error('Failed to respond to request');
        return false;
      }
    })();
  }, [isAuthenticated, user, socket, connected, fetchConversations]);

  // Get conversation requests (for doctors)
  const fetchPendingRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    if (!user || user?.role !== 'doctor') return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Add optimistic update - set empty array before API call
      // This prevents showing stale data if the request fails
      setPendingRequests([]);

      const response = await axios.get(
        `${API_URL}/messages/conversations/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          // Add error handling parameters
          validateStatus: status => status < 500
        }
      );

      if (response.data && response.data.success) {
        setPendingRequests(response.data.data || []);
      } else if (response.status === 400) {
        // Handle 400 error - likely means no requests or invalid parameters
        // Just set empty array and don't show error toast
        setPendingRequests([]);
      }
    } catch (error) {
      // Log the error safely without accessing potentially undefined properties
      console.error('Error fetching pending requests:', error || {});

      // Set empty array to prevent UI issues
      setPendingRequests([]);

      // Only show toast error if it's a network error or server error
      if (!error.response || error.response.status >= 500) {
        toast.error('Failed to load chat requests');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Start or get a conversation with a user (for doctors)
  const startConversation = useCallback(async (participantId) => {
    if (!isAuthenticated || !participantId || user?.role !== 'doctor') return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/messages/conversations`,
        { participantId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const newConversation = response.data.data;

        // Check if conversation already exists in list
        const exists = conversations.some(conv => conv._id === newConversation._id);

        if (!exists) {
          setConversations(prev => [newConversation, ...prev]);
        }

        // Set as current conversation
        setCurrentConversation(newConversation);

        // Fetch messages for this conversation
        fetchMessages(newConversation._id);

        return newConversation;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, conversations, fetchMessages]);

  // Send a message
  const sendMessage = useCallback((receiverId, content, attachments = []) => {
    if (!socket || !receiverId || !content) {
      return false;
    }

    // Create a temporary message to show immediately in UI with a unique ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      sender: { _id: user?.id, firstName: user?.firstName, lastName: user?.lastName },
      receiver: { _id: receiverId },
      content,
      attachments,
      createdAt: new Date().toISOString(),
      isRead: false,
      conversation: currentConversation?._id,
      status: 'sending',
      isTemp: true // Flag to identify temporary messages
    };

    // Add to messages immediately for instant feedback
    if (currentConversation && currentConversation.participant &&
        currentConversation.participant._id.toString() === receiverId.toString()) {
      setMessages(prev => [...prev, tempMessage]);
    }

    // Update conversations list with temp message
    updateConversationWithMessage({
      ...tempMessage,
      conversation: currentConversation?._id
    });

    // Emit message through socket
    socket.emit('sendMessage', {
      receiverId,
      content,
      attachments,
      tempId // Send tempId to match with real message later
    });

    return true;
  }, [socket, connected, user, currentConversation, updateConversationWithMessage]);

  // Send a message via HTTP (fallback)
  const sendMessageHttp = useCallback(async (receiverId, content, attachments = []) => {
    if (!isAuthenticated || !receiverId || !content) return;

    // Create a temporary message to show immediately in UI with a unique ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      sender: { _id: user?.id, firstName: user?.firstName, lastName: user?.lastName },
      receiver: { _id: receiverId },
      content,
      attachments,
      createdAt: new Date().toISOString(),
      isRead: false,
      conversation: currentConversation?._id,
      status: 'sending',
      isTemp: true // Flag to identify temporary messages
    };

    // Add to messages immediately for instant feedback
    if (currentConversation && currentConversation.participant &&
        currentConversation.participant._id && receiverId &&
        currentConversation.participant._id.toString() === receiverId.toString()) {
      setMessages(prev => [...prev, tempMessage]);
    }

    // Update conversations list with temp message
    updateConversationWithMessage({
      ...tempMessage,
      conversation: currentConversation?._id
    });

    try {
      const response = await axios.post(
        `${API_URL}/messages`,
        { receiverId, content, attachments },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const message = response.data.data;

        // Replace temp message with real one if in current conversation
        if (currentConversation && currentConversation.participant &&
            currentConversation.participant._id && receiverId &&
            currentConversation.participant._id.toString() === receiverId.toString()) {
          setMessages(prev =>
            prev.map(msg =>
              msg.isTemp && msg._id === tempId ?
                { ...message, status: 'sent' } : msg
            )
          );
        }

        // Update conversations list
        updateConversationWithMessage(message);

        return message;
      }
    } catch (error) {
      console.error('Error sending message via HTTP:', error);

      // Mark the temp message as failed
      if (currentConversation && currentConversation.participant &&
          currentConversation.participant._id && receiverId &&
          currentConversation.participant._id.toString() === receiverId.toString()) {
        setMessages(prev =>
          prev.map(msg =>
            msg.isTemp && msg._id === tempId ?
              { ...msg, status: 'failed' } : msg
          )
        );
      }

      toast.error('Failed to send message');
    }
  }, [isAuthenticated, user, currentConversation, updateConversationWithMessage]);

  // Mark a message as read
  const markAsRead = useCallback((messageId) => {
    if (!socket || !connected || !messageId) {
      return false;
    }

    // Emit through socket
    socket.emit('markAsRead', { messageId });

    return true;
  }, [socket, connected]);

  // Mark a message as read via HTTP (fallback)
  const markAsReadHttp = useCallback(async (messageId) => {
    if (!isAuthenticated || !messageId) return;

    try {
      const response = await axios.patch(
        `${API_URL}/messages/${messageId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Update message in state
        setMessages(prev =>
          prev.map(msg =>
            msg._id && messageId && msg._id.toString() === messageId.toString()
              ? { ...msg, isRead: true, readAt: new Date() }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error marking message as read via HTTP:', error);
    }
  }, [isAuthenticated]);

  // Send typing indicator
  const sendTypingStatus = useCallback((receiverId, isTyping) => {
    if (!socket || !connected || !receiverId) {
      return;
    }

    if (isTyping) {
      socket.emit('typing', { receiverId });
    } else {
      socket.emit('stopTyping', { receiverId });
    }
  }, [socket, connected]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    if (!isAuthenticated || !conversationId) return;

    try {
      const response = await axios.delete(
        `${API_URL}/messages/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Remove conversation from state
        setConversations(prev =>
          prev.filter(conv => conv._id !== conversationId)
        );

        // Clear current conversation if it's the deleted one
        if (currentConversation && currentConversation._id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }

        toast.success('Conversation deleted');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [isAuthenticated, currentConversation]);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();

      // Only fetch pending requests if the user is a doctor
      if (user.role === 'doctor') {
        // Wrap in try-catch to prevent any errors from breaking the app
        try {
          fetchPendingRequests();
        } catch (err) {
          console.error('Error in fetchPendingRequests effect:', err);
        }
      }
    }
  }, [isAuthenticated, fetchConversations, fetchPendingRequests, user]);

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  // Check if a user is typing
  const isUserTyping = useCallback((userId) => {
    return typingUsers[userId] || false;
  }, [typingUsers]);

  // Expose setMessages as updateMessages
  const updateMessages = useCallback((updater) => {
    setMessages(typeof updater === 'function' ? updater : () => updater);
  }, []);

  // Context value
  const value = {
    socket,
    connected,
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    updateMessages, // Add this line
    loading,
    onlineUsers,
    pendingRequests,
    requestStatus,
    fetchConversations,
    fetchMessages,
    startConversation,
    requestConversation,
    respondToRequest,
    fetchPendingRequests,
    sendMessage,
    sendMessageHttp,
    markAsRead,
    markAsReadHttp,
    sendTypingStatus,
    deleteConversation,
    isUserOnline,
    isUserTyping
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Group, Channel, Message, User, ActiveChat, FriendRequest } from '../types/chat';
import { api, getStoredToken } from '../lib/api';
import { useAuth } from './AuthContext';

interface TypingStatus {
  userId: string;
  userName: string;
}

interface ChatContextType {
  myGroups: Group[];
  exploreGroups: Group[];
  allUsers: User[];
  onlineUserIds: string[];
  activeChat: ActiveChat;
  currentGroup: Group | null;
  currentChannel: Channel | null;
  currentFriend: User | null;
  messages: Message[];
  isLoadingMessages: boolean;
  typingUsers: TypingStatus[];
  isConnected: boolean;
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  customLogoUrl: string;
  selectChannel: (groupId: string, channelId: string) => void;
  selectDirectChat: (friendId: string) => void;
  sendMessage: (text: string, mediaUrl?: string, replyTo?: Message['replyTo']) => void;
  sendTyping: (isTyping: boolean) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  createGroup: (payload: { name: string; description?: string; icon?: string; isPrivate?: boolean }) => Promise<Group>;
  joinGroup: (payload: { groupId?: string; inviteCode?: string }) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addChannel: (groupId: string, payload: { name: string; description?: string }) => Promise<void>;
  deleteChannel: (groupId: string, channelId: string) => Promise<void>;
  inviteFriendToGroup: (groupId: string, userId: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  sendFriendRequest: (target: string) => Promise<string>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  isAdmin: boolean;
  adminUsers: User[];
  fetchAdminUsers: () => Promise<User[]>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  purgeTestAccounts: () => Promise<number>;
  deleteMyAccount: () => Promise<void>;
  fetchAdminAllChats: () => Promise<{ groupChats: any[]; directConversations: any[]; totalMessages: number }>;
  claimAdmin: (password: string) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  updateCustomLogo: (logoUrl: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, logout, setUser, refetchUser } = useAuth();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [exploreGroups, setExploreGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('/logo.svg');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Default active chat (starts at Direct Messages until user joins/creates a group)
  const [activeChat, setActiveChat] = useState<ActiveChat>({
    type: 'direct',
    friendId: '',
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  const isAdmin = Boolean(user?.isAdmin);

  // Derived current group & channel or friend
  const currentGroup = activeChat.type === 'channel'
    ? myGroups.find(g => g.id === activeChat.groupId) || null
    : null;

  const currentChannel = currentGroup && activeChat.type === 'channel'
    ? currentGroup.channels.find(c => c.id === activeChat.channelId) || currentGroup.channels[0] || null
    : null;

  const currentFriend = activeChat.type === 'direct'
    ? allUsers.find(u => u.id === activeChat.friendId) || null
    : null;

  // Fetch app configuration (custom logo)
  useEffect(() => {
    api.getAppConfig().then(res => {
      if (res?.customLogoUrl) {
        setCustomLogoUrl(res.customLogoUrl);
      }
    }).catch(() => {});
  }, []);

  // Refresh groups from server
  const refreshGroups = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getGroups();
      setMyGroups(res.myGroups);
      setExploreGroups(res.exploreGroups);

      // If active group is not set or not in myGroups, default to first available
      if (res.myGroups.length > 0) {
        setActiveChat(prev => {
          if (prev.type === 'channel') {
            const exists = res.myGroups.some(g => g.id === prev.groupId);
            if (!exists) {
              const first = res.myGroups[0];
              return {
                type: 'channel',
                groupId: first.id,
                channelId: first.channels[0]?.id || 'general',
              };
            }
          }
          return prev;
        });
      } else {
        // No groups joined yet: keep in direct messages
        setActiveChat(prev => (prev.type === 'channel' ? { type: 'direct', friendId: '' } : prev));
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, [user]);

  // Refresh registered users (respects friendship / admin rules on server)
  const refreshUsers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getUsers();
      setAllUsers(res.users);
      setOnlineUserIds(res.onlineUserIds);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [user]);

  // Refresh pending friend requests
  const refreshFriendRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getFriendRequests();
      setFriendRequests(res);
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    }
  }, [user]);

  // Initial load when user changes
  useEffect(() => {
    if (user) {
      refreshGroups();
      refreshUsers();
      refreshFriendRequests();
    } else {
      setMyGroups([]);
      setExploreGroups([]);
      setAllUsers([]);
      setOnlineUserIds([]);
      setFriendRequests({ incoming: [], outgoing: [] });
    }
  }, [user, refreshGroups, refreshUsers, refreshFriendRequests]);

  // Load message history when activeChat changes
  const loadMessages = useCallback(async () => {
    if (!user) return;

    if (
      activeChat.type === 'channel' &&
      (!activeChat.groupId ||
        !activeChat.channelId ||
        activeChat.groupId === 'undefined' ||
        activeChat.channelId === 'undefined')
    ) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    if (
      activeChat.type === 'direct' &&
      (!activeChat.friendId ||
        activeChat.friendId === 'undefined' ||
        activeChat.friendId === 'null')
    ) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    try {
      if (activeChat.type === 'channel') {
        const res = await api.getChannelMessages(activeChat.groupId, activeChat.channelId);
        setMessages(res.messages || []);
      } else if (activeChat.type === 'direct') {
        const res = await api.getDirectMessages(activeChat.friendId);
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      setTypingUsers([]);
    }
  }, [user, activeChat]);

  useEffect(() => {
    if (user) {
      refreshGroups();
      refreshUsers();
    }
  }, [user, refreshGroups, refreshUsers]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isDisposed = false;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isDisposed) return;
        setIsConnected(true);

        // Authenticate socket
        const token = getStoredToken();
        if (token) {
          socket.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'auth_success') {
            if (data.onlineUsers) {
              setOnlineUserIds(data.onlineUsers);
            }
          }

          if (data.type === 'user_presence') {
            if (data.onlineUsers) {
              setOnlineUserIds(data.onlineUsers);
            } else if (data.status === 'online') {
              setOnlineUserIds(prev => Array.from(new Set([...prev, data.userId])));
            } else if (data.status === 'offline') {
              setOnlineUserIds(prev => prev.filter(id => id !== data.userId));
            }
          }

          if (data.type === 'new_message') {
            const incomingMsg: Message = data.message;
            // Check if message belongs to current view
            setActiveChat(currentChat => {
              const isRelevant =
                (currentChat.type === 'channel' &&
                  incomingMsg.groupId === currentChat.groupId &&
                  incomingMsg.channelId === currentChat.channelId) ||
                (currentChat.type === 'direct' &&
                  !incomingMsg.groupId &&
                  (incomingMsg.senderId === currentChat.friendId || incomingMsg.recipientId === currentChat.friendId));

              if (isRelevant) {
                setMessages(prev => {
                  // Idempotency: avoid duplicates
                  if (prev.some(m => m.id === incomingMsg.id)) {
                    return prev;
                  }
                  return [...prev, incomingMsg];
                });
              }
              return currentChat;
            });
          }

          if (data.type === 'message_reaction_updated') {
            setMessages(prev =>
              prev.map(m =>
                m.id === data.messageId ? { ...m, reactions: data.reactions } : m
              )
            );
          }

          if (data.type === 'user_typing') {
            const { userId, userName, groupId, channelId, recipientId, isTyping } = data;

            setActiveChat(currentChat => {
              const isCurrentContext =
                (currentChat.type === 'channel' &&
                  currentChat.groupId === groupId &&
                  currentChat.channelId === channelId) ||
                (currentChat.type === 'direct' && currentChat.friendId === userId);

              if (isCurrentContext && userId !== user.id) {
                setTypingUsers(prev => {
                  if (isTyping) {
                    if (prev.some(t => t.userId === userId)) return prev;
                    return [...prev, { userId, userName }];
                  } else {
                    return prev.filter(t => t.userId !== userId);
                  }
                });
              }
              return currentChat;
            });
          }

          if (data.type === 'group_created' || data.type === 'group_updated') {
            refreshGroups();
          }

          if (data.type === 'group_deleted') {
            const deletedId = data.groupId;
            refreshGroups();
            setActiveChat(prev => {
              if (prev.type === 'channel' && prev.groupId === deletedId) {
                return { type: 'direct', friendId: '' };
              }
              return prev;
            });
          }

          if (data.type === 'channel_deleted') {
            const { groupId, channelId, group } = data;
            refreshGroups();
            setActiveChat(prev => {
              if (prev.type === 'channel' && prev.groupId === groupId && prev.channelId === channelId) {
                const firstRemaining = group?.channels?.[0]?.id;
                if (firstRemaining) {
                  return { type: 'channel', groupId, channelId: firstRemaining };
                }
                return { type: 'direct', friendId: '' };
              }
              return prev;
            });
          }

          if (data.type === 'user_updated') {
            refreshUsers();
            if (data.user && user && data.user.id === user.id) {
              setUser(data.user);
            }
          }

          if (data.type === 'friend_request_received') {
            refreshFriendRequests();
          }

          if (data.type === 'friend_request_accepted') {
            refreshFriendRequests();
            refreshUsers();
          }

          if (data.type === 'friend_removed') {
            refreshFriendRequests();
            refreshUsers();
          }

          if (data.type === 'account_blocked' || (data.type === 'user_blocked' && data.userId === user?.id)) {
            console.warn('Account blocked by administrator');
            logout();
          }

          if (data.type === 'user_blocked' || data.type === 'user_unblocked') {
            refreshUsers();
          }

          if (data.type === 'logo_updated' && data.logoUrl) {
            setCustomLogoUrl(data.logoUrl);
          }
        } catch (err) {
          console.error('Socket message handler error:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!isDisposed) {
          // Reconnect with 3-second delay
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error, waiting for reconnect', err);
      };
    };

    connectWebSocket();

    // Heartbeat ping interval every 25 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      isDisposed = true;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, refreshGroups, refreshUsers]);

  // Actions
  const selectChannel = (groupId: string, channelId: string) => {
    setActiveChat({ type: 'channel', groupId, channelId });
  };

  const selectDirectChat = (friendId: string) => {
    setActiveChat({ type: 'direct', friendId });
  };

  const sendMessage = (text: string, mediaUrl?: string, replyTo?: Message['replyTo']) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Socket not connected');
      return;
    }

    if (activeChat.type === 'channel') {
      if (!activeChat.groupId || !activeChat.channelId) return;
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        groupId: activeChat.groupId,
        channelId: activeChat.channelId,
        text,
        mediaUrl,
        replyTo,
      }));
    } else if (activeChat.friendId && activeChat.friendId.trim()) {
      socketRef.current.send(JSON.stringify({
        type: 'send_message',
        recipientId: activeChat.friendId,
        text,
        mediaUrl,
        replyTo,
      }));
    }

    // Stop typing immediately when sending
    sendTyping(false);
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (activeChat.type === 'channel') {
      if (!activeChat.groupId || !activeChat.channelId) return;
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        groupId: activeChat.groupId,
        channelId: activeChat.channelId,
        isTyping,
      }));
    } else if (activeChat.friendId && activeChat.friendId.trim()) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        recipientId: activeChat.friendId,
        isTyping,
      }));
    }

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3500);
    }
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'react_message',
      messageId,
      emoji,
    }));
  };

  const createGroup = async (payload: {
    name: string;
    description?: string;
    icon?: string;
    isPrivate?: boolean;
  }) => {
    const res = await api.createGroup(payload);
    await refreshGroups();
    const newGroup = res.group;
    if (newGroup.channels[0]) {
      setActiveChat({
        type: 'channel',
        groupId: newGroup.id,
        channelId: newGroup.channels[0].id,
      });
    }
    return newGroup;
  };

  const joinGroup = async (payload: { groupId?: string; inviteCode?: string }) => {
    const res = await api.joinGroup(payload);
    await refreshGroups();
    const joined = res.group;
    if (joined.channels[0]) {
      setActiveChat({
        type: 'channel',
        groupId: joined.id,
        channelId: joined.channels[0].id,
      });
    }
    return joined;
  };

  const leaveGroup = async (groupId: string) => {
    await api.leaveGroup(groupId);
    await refreshGroups();
  };

  const deleteGroup = async (groupId: string) => {
    await api.deleteGroup(groupId);
    await refreshGroups();
    setActiveChat(prev => {
      if (prev.type === 'channel' && prev.groupId === groupId) {
        return { type: 'direct', friendId: '' };
      }
      return prev;
    });
  };

  const addChannel = async (groupId: string, payload: { name: string; description?: string }) => {
    const res = await api.addChannel(groupId, payload);
    await refreshGroups();
    setActiveChat({
      type: 'channel',
      groupId,
      channelId: res.channel.id,
    });
  };

  const deleteChannel = async (groupId: string, channelId: string) => {
    const res = await api.deleteChannel(groupId, channelId);
    await refreshGroups();
    setActiveChat(prev => {
      if (prev.type === 'channel' && prev.groupId === groupId && prev.channelId === channelId) {
        const remainingChannel = res.group?.channels?.[0];
        if (remainingChannel) {
          return {
            type: 'channel',
            groupId,
            channelId: remainingChannel.id,
          };
        }
        return { type: 'direct', friendId: '' };
      }
      return prev;
    });
  };

  const inviteFriendToGroup = async (groupId: string, userId: string) => {
    await api.addMemberToGroup(groupId, userId);
    await refreshGroups();
  };

  const sendFriendRequest = async (target: string) => {
    const res = await api.sendFriendRequest(target);
    await refreshFriendRequests();
    return res.message;
  };

  const acceptFriendRequest = async (requestId: string) => {
    await api.acceptFriendRequest(requestId);
    await refreshFriendRequests();
    await refreshUsers();
  };

  const rejectFriendRequest = async (requestId: string) => {
    await api.rejectFriendRequest(requestId);
    await refreshFriendRequests();
  };

  const fetchAdminUsers = async () => {
    const res = await api.getAdminUsers();
    setAdminUsers(res.users);
    return res.users;
  };

  const blockUser = async (userId: string) => {
    await api.blockUser(userId);
    await refreshUsers();
    await fetchAdminUsers();
  };

  const unblockUser = async (userId: string) => {
    await api.unblockUser(userId);
    await refreshUsers();
    await fetchAdminUsers();
  };

  const deleteUserByAdmin = async (userId: string) => {
    await api.deleteUserByAdmin(userId);
    await refreshUsers();
    await fetchAdminUsers();
  };

  const purgeTestAccounts = async () => {
    const res = await api.purgeTestAccounts();
    await refreshUsers();
    await fetchAdminUsers();
    return res.removedCount;
  };

  const deleteMyAccount = async () => {
    await api.deleteMyAccount();
    await logout();
  };

  const fetchAdminAllChats = async () => {
    return await api.getAdminAllChats();
  };

  const claimAdmin = async (password: string) => {
    const res = await api.claimAdmin(password);
    if (res?.user && setUser) {
      setUser(res.user);
    } else if (refetchUser) {
      await refetchUser();
    }
    await refreshGroups();
    await refreshUsers();
  };

  const updateAdminPassword = async (newPassword: string) => {
    await api.updateAdminPassword(newPassword);
  };

  const updateCustomLogo = async (logoUrl: string) => {
    await api.updateLogo(logoUrl);
    setCustomLogoUrl(logoUrl);
  };

  return (
    <ChatContext.Provider
      value={{
        myGroups,
        exploreGroups,
        allUsers,
        onlineUserIds,
        activeChat,
        currentGroup,
        currentChannel,
        currentFriend,
        messages,
        isLoadingMessages,
        typingUsers,
        isConnected,
        selectChannel,
        selectDirectChat,
        sendMessage,
        sendTyping,
        reactToMessage,
        createGroup,
        joinGroup,
        leaveGroup,
        deleteGroup,
        addChannel,
        deleteChannel,
        inviteFriendToGroup,
        refreshGroups,
        refreshUsers,
        refreshFriendRequests,
        friendRequests,
        customLogoUrl,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        isAdmin,
        adminUsers,
        fetchAdminUsers,
        blockUser,
        unblockUser,
        deleteUserByAdmin,
        purgeTestAccounts,
        deleteMyAccount,
        fetchAdminAllChats,
        claimAdmin,
        updateAdminPassword,
        updateCustomLogo,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

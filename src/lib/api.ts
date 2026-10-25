import { User, Group, Channel, Message } from '../types/chat';

const TOKEN_KEY = 'squadchat_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    // If server responded with HTML or other non-JSON content
    if (!res.ok) {
      throw new Error(`Server returned error (${res.status} ${res.statusText})`);
    }
    throw new Error('Received unexpected non-JSON response from server');
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: {
    username: string;
    password: string;
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => request<{ user: User; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  login: (payload: { username: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: User; onlineUsers: string[] }>('/api/auth/me'),

  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  updateProfile: (payload: {
    displayName?: string;
    avatarColor?: string;
    avatarIcon?: string;
    avatarUrl?: string;
    bio?: string;
  }) => request<{ user: User }>('/api/users/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Users
  getUsers: () => request<{ users: User[]; onlineUserIds: string[] }>('/api/users'),

  // Groups
  getGroups: () => request<{ myGroups: Group[]; exploreGroups: Group[] }>('/api/groups'),

  createGroup: (payload: {
    name: string;
    description?: string;
    icon?: string;
    isPrivate?: boolean;
    initialMembers?: string[];
  }) => request<{ group: Group }>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  joinGroup: (payload: { groupId?: string; inviteCode?: string }) =>
    request<{ group: Group }>('/api/groups/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  leaveGroup: (groupId: string) =>
    request<{ success: boolean; groupId: string }>(`/api/groups/${groupId}/leave`, {
      method: 'POST',
    }),

  deleteGroup: (groupId: string) =>
    request<{ success: boolean; groupId: string }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    }),

  addChannel: (groupId: string, payload: { name: string; description?: string }) =>
    request<{ channel: Channel; group: Group }>(`/api/groups/${groupId}/channels`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteChannel: (groupId: string, channelId: string) =>
    request<{ success: boolean; group: Group; deletedChannelId: string }>(`/api/groups/${groupId}/channels/${channelId}`, {
      method: 'DELETE',
    }),

  addMemberToGroup: (groupId: string, userId: string) =>
    request<{ group: Group }>(`/api/groups/${groupId}/add-member`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Messages
  getChannelMessages: (groupId: string, channelId: string) => {
    if (
      !groupId ||
      !channelId ||
      groupId === 'undefined' ||
      channelId === 'undefined' ||
      groupId === 'null' ||
      channelId === 'null'
    ) {
      return Promise.resolve({ messages: [] });
    }
    return request<{ messages: Message[] }>(`/api/groups/${encodeURIComponent(groupId)}/channels/${encodeURIComponent(channelId)}/messages`);
  },

  getDirectMessages: (friendId: string) => {
    if (
      !friendId ||
      friendId === 'undefined' ||
      friendId === 'null'
    ) {
      return Promise.resolve({ messages: [] });
    }
    return request<{ messages: Message[] }>(`/api/direct/${encodeURIComponent(friendId)}/messages`);
  },

  // Friend Requests (Requirement 3)
  getFriendRequests: () =>
    request<{ incoming: any[]; outgoing: any[] }>('/api/friends/requests'),

  sendFriendRequest: (target: string) =>
    request<{ request: any; message: string }>('/api/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ target }),
    }),

  acceptFriendRequest: (id: string) =>
    request<{ success: boolean; request: any }>(`/api/friends/requests/${id}/accept`, {
      method: 'POST',
    }),

  rejectFriendRequest: (id: string) =>
    request<{ success: boolean }>(`/api/friends/requests/${id}/reject`, {
      method: 'POST',
    }),

  removeFriend: (friendId: string) =>
    request<{ success: boolean }>(`/api/friends/${friendId}`, {
      method: 'DELETE',
    }),

  // Admin Console (Requirement 1 & 4)
  getAdminUsers: () =>
    request<{ users: User[]; onlineUserIds: string[] }>('/api/admin/users'),

  blockUser: (userId: string) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${userId}/block`, {
      method: 'POST',
    }),

  unblockUser: (userId: string) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${userId}/unblock`, {
      method: 'POST',
    }),

  deleteUserByAdmin: (userId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  purgeTestAccounts: () =>
    request<{ success: boolean; removedCount: number }>('/api/admin/purge-test-accounts', {
      method: 'POST',
    }),

  deleteMyAccount: () =>
    request<{ success: boolean }>('/api/users/me', {
      method: 'DELETE',
    }),

  getAdminAllChats: () =>
    request<{ groupChats: any[]; directConversations: any[]; totalMessages: number }>('/api/admin/all-chats'),

  claimAdmin: (password: string) =>
    request<{ success: boolean; user: User }>('/api/admin/claim', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  updateAdminPassword: (newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/admin/password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  updateLogo: (logoUrl: string) =>
    request<{ success: boolean; logoUrl: string }>('/api/admin/logo', {
      method: 'POST',
      body: JSON.stringify({ logoUrl }),
    }),

  getAppConfig: () =>
    request<{ customLogoUrl: string }>('/api/app-config'),
};

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarIcon: string;
  avatarUrl?: string;
  bio?: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarColor: string;
  senderAvatarIcon: string;
  senderAvatarUrl?: string;
  receiverId: string;
  receiverName: string;
  receiverUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  inviteCode: string;
  isPrivate: boolean;
  createdBy: string;
  creatorName: string;
  adminIds?: string[];
  memberIds: string[];
  channels: Channel[];
  createdAt: number;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  groupId?: string;
  channelId?: string;
  recipientId?: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarColor: string;
  senderAvatarIcon: string;
  senderAvatarUrl?: string;
  text: string;
  mediaUrl?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions: MessageReaction[];
  createdAt: number;
}

export type ActiveChat =
  | { type: 'channel'; groupId: string; channelId: string }
  | { type: 'direct'; friendId: string };

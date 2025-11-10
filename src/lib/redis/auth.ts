import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getRedisClient, setJson, getJson, deleteJson } from './client';
import { config } from '@/lib/config';
import { REDIS_KEYS } from '@/utils/constants';
import { User, UserSettings } from './types';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT tokens
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.auth.sessionSecret, { expiresIn: '1h' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, config.auth.sessionSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.auth.sessionSecret) as any;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

// User operations
export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const client = await getRedisClient();

  // Generate user ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newUser: User = {
    ...user,
    id: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const key = REDIS_KEYS.user(userId);
  await setJson(key, newUser);

  return newUser;
}

export async function getUserById(userId: string): Promise<User | null> {
  const key = REDIS_KEYS.user(userId);
  return getJson<User>(key);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await getRedisClient();

  // In a real implementation, you'd want an index for email lookups
  // For now, we'll scan through users (not efficient for production)
  const pattern = REDIS_KEYS.user('*');
  const keys = await client.keys(pattern);

  for (const key of keys) {
    const user = await getJson<User>(key);
    if (user && user.email === email) {
      return user;
    }
  }

  return null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const updatedUser: User = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const key = REDIS_KEYS.user(userId);
  await setJson(key, updatedUser);

  return updatedUser;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const key = REDIS_KEYS.user(userId);
  return deleteJson(key);
}

// User settings operations
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const key = REDIS_KEYS.userSettings(userId);
  return getJson<UserSettings>(key);
}

export async function saveUserSettings(userId: string, settings: Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserSettings> {
  const existing = await getUserSettings(userId);

  const userSettings: UserSettings = {
    ...settings,
    userId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const key = REDIS_KEYS.userSettings(userId);
  await setJson(key, userSettings);

  return userSettings;
}

export async function updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
  const settings = await getUserSettings(userId);
  if (!settings) return null;

  const updatedSettings: UserSettings = {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const key = REDIS_KEYS.userSettings(userId);
  await setJson(key, updatedSettings);

  return updatedSettings;
}

// Session management (for API routes)
export async function createSession(userId: string, data: any = {}): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionData = {
    userId,
    ...data,
    createdAt: new Date().toISOString(),
  };

  // Store session with 24 hour TTL
  const key = `session:${sessionId}`;
  await setJson(key, sessionData, 86400);

  return sessionId;
}

export async function getSession(sessionId: string): Promise<any | null> {
  const key = `session:${sessionId}`;
  return getJson(key);
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const key = `session:${sessionId}`;
  return deleteJson(key);
}

export async function extendSession(sessionId: string): Promise<boolean> {
  const client = await getRedisClient();
  const key = `session:${sessionId}`;

  // Extend TTL by 24 hours
  const result = await client.expire(key, 86400);
  return result === 1;
}

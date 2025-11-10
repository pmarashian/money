import { cookies } from 'next/headers';
import { getSession as getRedisSession, extendSession, verifyToken } from '@/lib/redis/auth';
import { getSession as getEdgeSession, setSession as setEdgeSession, deleteSession as deleteEdgeSession } from '@/lib/redis/edge';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionData {
  userId: string;
  user?: AuthUser;
  createdAt: string;
}

// Get current user from session (server-side)
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sessionId')?.value;
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!sessionId && !accessToken) {
      return null;
    }

    // Try access token first (faster)
    if (accessToken) {
      const tokenData = verifyToken(accessToken);
      if (tokenData) {
        // Get user data from Redis
        const { getUserById } = await import('@/lib/redis/auth');
        const user = await getUserById(tokenData.userId);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      }
    }

    // Fall back to session
    if (sessionId) {
      const sessionData = await getRedisSession(sessionId);
      if (sessionData) {
        // Extend session if it's close to expiring
        const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
        if (sessionAge > 12 * 60 * 60 * 1000) { // 12 hours
          await extendSession(sessionId);
        }

        // Get user data
        const { getUserById } = await import('@/lib/redis/auth');
        const user = await getUserById(sessionData.userId);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get current user for Edge Runtime
export async function getCurrentUserEdge(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('sessionId')?.value;

    if (!sessionId) {
      return null;
    }

    const sessionData = await getEdgeSession(sessionId);
    if (sessionData) {
      return {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user (Edge):', error);
    return null;
  }
}

// Require authentication (redirect to login if not authenticated)
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * MSW handlers for Supabase Auth API
 * Mocks authentication operations for testing
 */

import { http, HttpResponse } from 'msw';
import { db } from '../db';

// Get Supabase URL from environment or use a test URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
const AUTH_API_URL = `${SUPABASE_URL}/auth/v1`;

// Mock session storage
const sessions = new Map<string, any>();

/**
 * Generate a mock JWT token (not cryptographically secure, just for testing)
 */
function generateMockToken(userId: string): string {
  return `mock-jwt-${userId}-${Date.now()}`;
}

/**
 * Create a mock session for a user
 */
function createSession(userId: string, email: string) {
  const accessToken = generateMockToken(userId);
  const refreshToken = generateMockToken(`refresh-${userId}`);

  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  sessions.set(accessToken, session);
  return session;
}

export const authHandlers = [
  // ============================================
  // SIGN UP
  // ============================================
  http.post(`${AUTH_API_URL}/signup`, async ({ request }) => {
    const body = (await request.json()) as any;
    const { email, password } = body;

    // Check if user already exists
    const existingProfile = Array.from(db.profiles.values()).find(p => p.email === email);

    if (existingProfile) {
      return HttpResponse.json({ error: 'User already registered' }, { status: 400 });
    }

    // Create new user
    const userId = `user-${Date.now()}`;
    const session = createSession(userId, email);

    // Create profile (simulating the auto-creation in AuthContext)
    const profile = {
      id: userId,
      email,
      first_name: '',
      last_initial: '',
      timezone: 'America/New_York',
      notification_preferences: {
        tasks: true,
        messages: true,
        milestones: true,
        daily: false,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.set(userId, profile);

    return HttpResponse.json({
      user: session.user,
      session,
    });
  }),

  // ============================================
  // SIGN IN WITH PASSWORD
  // ============================================
  http.post(`${AUTH_API_URL}/token`, async ({ request }) => {
    const body = (await request.json()) as any;
    const { email, password, grant_type } = body;

    // Handle refresh token
    if (grant_type === 'refresh_token') {
      const refreshToken = body.refresh_token;
      // Find session by refresh token
      const existingSession = Array.from(sessions.values()).find(
        s => s.refresh_token === refreshToken
      );

      if (!existingSession) {
        return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 400 });
      }

      // Create new session with same user
      const newSession = createSession(existingSession.user.id, existingSession.user.email);

      return HttpResponse.json({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_in: newSession.expires_in,
        expires_at: newSession.expires_at,
        token_type: 'bearer',
        user: newSession.user,
      });
    }

    // Handle password sign in
    if (grant_type === 'password') {
      // Find user by email
      const profile = Array.from(db.profiles.values()).find(p => p.email === email);

      if (!profile) {
        return HttpResponse.json({ error: 'Invalid login credentials' }, { status: 400 });
      }

      // Create session
      const session = createSession(profile.id, email);

      return HttpResponse.json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: 'bearer',
        user: session.user,
      });
    }

    return HttpResponse.json({ error: 'Invalid grant type' }, { status: 400 });
  }),

  // ============================================
  // GET USER (from session)
  // ============================================
  http.get(`${AUTH_API_URL}/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const session = sessions.get(token);

    if (!session) {
      return HttpResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return HttpResponse.json(session.user);
  }),

  // ============================================
  // SIGN OUT
  // ============================================
  http.post(`${AUTH_API_URL}/logout`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      sessions.delete(token);
    }

    return HttpResponse.json(null, { status: 204 });
  }),

  // ============================================
  // GOOGLE OAUTH (simplified for testing)
  // ============================================
  http.post(`${AUTH_API_URL}/token?grant_type=id_token`, async ({ request }) => {
    const body = (await request.json()) as any;
    const { id_token } = body;

    // In tests, we'll just parse the email from a mock token
    // In real scenarios, this would validate the Google ID token
    const mockEmail = `google-${Date.now()}@test.com`;
    const userId = `google-user-${Date.now()}`;

    // Check if profile exists
    let profile = Array.from(db.profiles.values()).find(p => p.email === mockEmail);

    // Create profile if it doesn't exist
    if (!profile) {
      profile = {
        id: userId,
        email: mockEmail,
        first_name: '',
        last_initial: '',
        timezone: 'America/New_York',
        notification_preferences: {
          tasks: true,
          messages: true,
          milestones: true,
          daily: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.profiles.set(userId, profile);
    }

    // Create session
    const session = createSession(profile.id, profile.email);

    return HttpResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: 'bearer',
      user: session.user,
    });
  }),
];

/**
 * Clear all sessions (call this in test cleanup)
 */
export function clearSessions() {
  sessions.clear();
}

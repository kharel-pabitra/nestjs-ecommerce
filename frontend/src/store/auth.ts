import { create } from 'zustand';
import type { AuthUser } from '../lib/types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

// Access token lives only in memory (short-lived); the refresh token is the
// HTTP-only cookie the backend sets on /auth/login. There is no backend
// /auth/logout route in this API, so "logging out" here just clears local
// state — the refresh cookie itself will simply expire after 7 days, or you
// can add a real logout endpoint on the backend to clear it explicitly.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () => set({ accessToken: null, user: null }),
}));

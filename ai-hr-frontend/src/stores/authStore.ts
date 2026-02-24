import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { orgName: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  refresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { default: api } = await import('@/lib/api');
        const res = await api.post('/auth/login', { email, password });
        const { user, tokens } = res.data.data;
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
      },

      register: async ({ orgName, name, email, password }) => {
        const { default: api } = await import('@/lib/api');
        const res = await api.post('/auth/register', { organizationName: orgName, name, email, password });
        const { user, tokens } = res.data.data;
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
      },

      logout: () => {
        const { refreshToken } = get();
        if (refreshToken) {
          import('@/lib/api').then(({ default: api }) => {
            api.post('/auth/logout', { refreshToken }).catch(() => {});
          });
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const { default: api } = await import('@/lib/api');
          const res = await api.post('/auth/refresh', { refreshToken });
          const { tokens } = res.data.data;
          set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'ai-hr-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

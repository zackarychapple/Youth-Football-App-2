/**
 * Mock Authentication for Testing
 * Provides stubbed responses for testing without real Supabase backend
 */

import { Page } from 'puppeteer';

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    name: string;
  };
}

export interface MockSession {
  access_token: string;
  refresh_token: string;
  user: MockUser;
}

/**
 * Inject mock Supabase authentication into the page
 */
export async function injectMockAuth(page: Page, user?: MockUser) {
  await page.evaluateOnNewDocument((mockUser) => {
    // Create mock Supabase client
    const mockSupabase = {
      auth: {
        signInWithPassword: async ({ email, password }: any) => {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check test credentials
          const validUsers = [
            { email: 'coach.test@footballtracker.app', password: 'GameDay2025!' },
            { email: 'assistant.test@footballtracker.app', password: 'Assistant2025!' },
            { email: 'coach2.test@footballtracker.app', password: 'Falcons2025!' }
          ];
          
          const isValid = validUsers.some(u => u.email === email && u.password === password);
          
          if (isValid) {
            const user = {
              id: 'test-user-' + Date.now(),
              email,
              user_metadata: { name: email.split('@')[0] }
            };
            
            const session = {
              access_token: 'mock-access-token-' + Date.now(),
              refresh_token: 'mock-refresh-token-' + Date.now(),
              user
            };
            
            // Store in localStorage to simulate persistence
            localStorage.setItem('football-tracker-auth', JSON.stringify({
              state: {
                user,
                session,
                isAuthenticated: true
              }
            }));
            
            return { data: { user, session }, error: null };
          } else {
            return { 
              data: null, 
              error: { message: 'Invalid login credentials' } 
            };
          }
        },
        
        signOut: async () => {
          localStorage.removeItem('football-tracker-auth');
          return { error: null };
        },
        
        refreshSession: async () => {
          const stored = localStorage.getItem('football-tracker-auth');
          if (stored) {
            const data = JSON.parse(stored);
            return { data: data.state, error: null };
          }
          return { data: { user: null, session: null }, error: null };
        },
        
        resetPasswordForEmail: async (email: string) => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { error: null };
        },
        
        onAuthStateChange: (callback: any) => {
          // Simulate auth state changes
          const stored = localStorage.getItem('football-tracker-auth');
          if (stored) {
            const data = JSON.parse(stored);
            setTimeout(() => {
              callback('SIGNED_IN', data.state.session);
            }, 100);
          }
          
          return {
            data: { subscription: { unsubscribe: () => {} } }
          };
        }
      },
      
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            then: async () => ({ data: [], error: null })
          })
        })
      }),
      
      rpc: async (funcName: string, params: any) => {
        // Mock RPC responses
        if (funcName === 'get_user_teams') {
          return {
            data: [{
              team_id: 'test-team-1',
              team_name: 'Cobb Eagles (Test Team)',
              invite_code: 'EAGLES25'
            }],
            error: null
          };
        }
        return { data: null, error: null };
      }
    };
    
    // Override the import
    (window as any).__mockSupabase = mockSupabase;
    
    // Override fetch to intercept Supabase calls
    const originalFetch = window.fetch;
    window.fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Intercept Supabase auth calls
      if (url && url.includes('supabase.co/auth')) {
        if (url.includes('/token')) {
          // Mock token endpoint
          return new Response(JSON.stringify({
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            user: mockUser || { id: 'test-user', email: 'test@example.com' }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Pass through other requests
      return originalFetch(input, init);
    };
  }, user);
}

/**
 * Setup mock authentication state
 */
export async function setupMockAuthState(page: Page, isAuthenticated: boolean = false) {
  if (isAuthenticated) {
    await page.evaluate(() => {
      const mockUser = {
        id: 'test-user-123',
        email: 'coach.test@footballtracker.app',
        user_metadata: { name: 'Test Coach' }
      };
      
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser
      };
      
      localStorage.setItem('football-tracker-auth', JSON.stringify({
        state: {
          user: mockUser,
          session: mockSession,
          isAuthenticated: true,
          currentTeam: {
            id: 'test-team-1',
            name: 'Cobb Eagles (Test Team)',
            invite_code: 'EAGLES25'
          }
        }
      }));
    });
  } else {
    await page.evaluate(() => {
      localStorage.removeItem('football-tracker-auth');
    });
  }
}

export default {
  injectMockAuth,
  setupMockAuthState
};
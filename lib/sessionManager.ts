import { supabase } from './supabase';

/**
 * SessionManager
 * Handles session access with throttling to prevent multiple simultaneous calls
 * that can cause the "Cannot get _acquireLock" error
 */
class SessionManager {
  private sessionLoading: boolean = false;
  private sessionPromise: Promise<any> | null = null;
  private lastSessionCheck: number = 0;
  private minInterval: number = 300; // Minimum time between session requests in ms

  /**
   * Gets the current session safely with throttling and locking
   * @returns Promise with session data
   */
  async getSession() {
    // If a session check is already in progress, return the existing promise
    if (this.sessionPromise) {
      console.log('[SessionManager] Using existing session promise');
      return this.sessionPromise;
    }

    // Check if we've made a request too recently
    const now = Date.now();
    if (now - this.lastSessionCheck < this.minInterval) {
      console.log('[SessionManager] Throttling session request, too soon');
      // Create a delayed promise that will resolve with the last session
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await this.getSession();
          resolve(result);
        }, this.minInterval - (now - this.lastSessionCheck));
      });
    }

    // If we're already loading, return a delayed retry
    if (this.sessionLoading) {
      console.log('[SessionManager] Session already loading, will retry');
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await this.getSession();
          resolve(result);
        }, 100);
      });
    }

    try {
      this.sessionLoading = true;
      console.log('[SessionManager] Getting fresh session');
      
      // Create a new session promise
      this.sessionPromise = supabase.auth.getSession();
      
      // Update the last check time
      this.lastSessionCheck = Date.now();
      
      // Wait for and return the result
      const result = await this.sessionPromise;
      return result;
    } catch (error) {
      console.error('[SessionManager] Error getting session:', error);
      throw error;
    } finally {
      this.sessionLoading = false;
      this.sessionPromise = null;
    }
  }

  /**
   * Gets the current user with throttling protection
   * @returns Promise with user data
   */
  async getUser() {
    // Get the session first to ensure we're authenticated
    const sessionResult = await this.getSession();
    
    // If no session, return null user
    if (!sessionResult.data.session) {
      return { data: { user: null }, error: null };
    }
    
    // Return the current user
    return supabase.auth.getUser();
  }

  /**
   * Checks if the user is authenticated
   * @returns Promise<boolean>
   */
  async isAuthenticated() {
    try {
      const { data } = await this.getSession();
      return !!data.session;
    } catch (error) {
      console.error('[SessionManager] Error checking authentication:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager(); 
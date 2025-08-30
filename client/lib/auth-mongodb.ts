// JWT + MongoDB Authentication API utilities

interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
}

interface ProfileResponse {
  success: boolean;
  user?: any;
  message?: string;
}

class AuthAPI {
  private baseURL = '/api/v2';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set authorization header
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
    };
  }

  // Store tokens
  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear tokens
  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Register user
  async register(userData: {
    email: string;
    username: string;
    name: string;
    password: string;
    provider?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Check availability
  async checkAvailability(email?: string, username?: string): Promise<{
    success: boolean;
    emailAvailable?: boolean;
    usernameAvailable?: boolean;
    message?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (username) params.append('username', username);

      const response = await fetch(`${this.baseURL}/auth/check-availability?${params}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Send email verification
  async sendEmailVerification(email: string): Promise<{
    success: boolean;
    message: string;
    debugCode?: string;
    expiresAt?: string;
    emailSent?: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Verify email code
  async verifyEmailCode(email: string, code: string): Promise<{
    success: boolean;
    message: string;
    attemptsRemaining?: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Complete registration
  async completeRegistration(userData: {
    email: string;
    username: string;
    name: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Get user profile (protected)
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      // If token is invalid, try to refresh
      if (!data.success && response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseURL}/profile`, {
            headers: this.getAuthHeaders(),
          });
          return await retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Update user profile (protected)
  async updateProfile(profileData: {
    name?: string;
    display_name?: string;
    bio?: string;
    profile_image_url?: string;
  }): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      // If token is invalid, try to refresh
      if (!data.success && response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseURL}/profile`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(profileData),
          });
          return await retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  // Logout
  logout() {
    this.clearTokens();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();
export default authAPI;

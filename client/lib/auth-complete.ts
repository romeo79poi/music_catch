// Complete Authentication Client for Frontend
// Supports all auth features: registration, login, verification, password reset, etc.

interface AuthUser {
  _id: string;
  email: string;
  username: string;
  name: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified: boolean;
  is_artist: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
  last_login?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  debugCode?: string;
  debugOtp?: string;
  expiresAt?: string;
  attemptsRemaining?: number;
}

interface AvailabilityResponse {
  success: boolean;
  emailAvailable?: boolean;
  usernameAvailable?: boolean;
  phoneAvailable?: boolean;
  message?: string;
}

class CompleteAuth {
  private baseURL = "/api/v3/auth";
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  // ==========================================
  // TOKEN MANAGEMENT
  // ==========================================

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // ==========================================
  // API REQUEST HELPER
  // ==========================================

  private async apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth = false,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: requireAuth
        ? this.getAuthHeaders()
        : { "Content-Type": "application/json" },
      ...options,
    };

    let response = await fetch(url, config);

    // Handle token expiry
    if (requireAuth && response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        config.headers = this.getAuthHeaders();
        response = await fetch(url, config);
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // ==========================================
  // REGISTRATION
  // ==========================================

  async registerWithEmail(userData: {
    email: string;
    username: string;
    name: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
    profileImageURL?: string;
  }): Promise<AuthResponse> {
    try {
      const data = await this.apiRequest<AuthResponse>("/register/email", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (data.success && data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  }

  async registerWithPhone(userData: {
    phone: string;
    username: string;
    name: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
  }): Promise<AuthResponse> {
    try {
      const data = await this.apiRequest<AuthResponse>("/register/phone", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (data.success && data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Phone registration failed",
      };
    }
  }

  // ==========================================
  // LOGIN
  // ==========================================

  async loginWithEmail(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResponse> {
    try {
      const data = await this.apiRequest<AuthResponse>("/login/email", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (data.success && data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  }

  async loginWithUsername(
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResponse> {
    try {
      const data = await this.apiRequest<AuthResponse>("/login/username", {
        method: "POST",
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (data.success && data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  }

  // ==========================================
  // VERIFICATION
  // ==========================================

  async sendEmailVerification(email: string): Promise<VerificationResponse> {
    try {
      return await this.apiRequest<VerificationResponse>(
        "/verification/email/send",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to send verification email",
      };
    }
  }

  async verifyEmailCode(
    email: string,
    code: string,
  ): Promise<VerificationResponse> {
    try {
      return await this.apiRequest<VerificationResponse>(
        "/verification/email/verify",
        {
          method: "POST",
          body: JSON.stringify({ email, code }),
        },
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Email verification failed",
      };
    }
  }

  async sendPhoneOTP(phone: string): Promise<VerificationResponse> {
    try {
      return await this.apiRequest<VerificationResponse>(
        "/verification/phone/send",
        {
          method: "POST",
          body: JSON.stringify({ phone }),
        },
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to send OTP",
      };
    }
  }

  async verifyPhoneOTP(
    phone: string,
    otp: string,
  ): Promise<VerificationResponse> {
    try {
      return await this.apiRequest<VerificationResponse>(
        "/verification/phone/verify",
        {
          method: "POST",
          body: JSON.stringify({ phone, otp }),
        },
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "OTP verification failed",
      };
    }
  }

  // ==========================================
  // AVAILABILITY CHECK
  // ==========================================

  async checkAvailability(params: {
    email?: string;
    username?: string;
    phone?: string;
  }): Promise<AvailabilityResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.email) queryParams.append("email", params.email);
      if (params.username) queryParams.append("username", params.username);
      if (params.phone) queryParams.append("phone", params.phone);

      return await this.apiRequest<AvailabilityResponse>(
        `/check-availability?${queryParams}`,
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Availability check failed",
      };
    }
  }

  // ==========================================
  // PASSWORD MANAGEMENT
  // ==========================================

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    try {
      return await this.apiRequest("/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Password reset request failed",
      };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiRequest("/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Password reset failed",
      };
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiRequest(
        "/password/change",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        true,
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Password change failed",
      };
    }
  }

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  async getProfile(): Promise<{
    success: boolean;
    user?: AuthUser;
    message?: string;
  }> {
    try {
      return await this.apiRequest("/profile", {}, true);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to get profile",
      };
    }
  }

  // ==========================================
  // TOKEN REFRESH
  // ==========================================

  async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      this.clearTokens();
      return false;
    }

    this.refreshPromise = (async (): Promise<boolean> => {
      try {
        const data = await this.apiRequest<{
          success: boolean;
          accessToken: string;
          refreshToken: string;
        }>("/token/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (data.success && data.accessToken && data.refreshToken) {
          this.saveTokens(data.accessToken, data.refreshToken);
          return true;
        } else {
          this.clearTokens();
          return false;
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        this.clearTokens();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiRequest("/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      this.clearTokens();
      return result;
    } catch (error: any) {
      this.clearTokens();
      return {
        success: true, // Still clear tokens even if logout request fails
        message: "Logged out successfully",
      };
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem("currentUser");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // Auto-refresh token before it expires (call this periodically)
  async maintainSession(): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      // Try to get profile to check if token is still valid
      const result = await this.getProfile();
      if (!result.success) {
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.error("Session maintenance failed:", error);
    }
  }
}

// Export singleton instance
export const authComplete = new CompleteAuth();
export default authComplete;

// Export types for use in components
export type {
  AuthUser,
  AuthResponse,
  VerificationResponse,
  AvailabilityResponse,
};

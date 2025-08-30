import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Local user interface for backend profile data
interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified: boolean;
  premium: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: any,
  ) => Promise<{ success: boolean; message: string }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ success: boolean; message: string }>;
  getSettings: () => Promise<{ success: boolean; data?: any; message: string }>;
  updateSettings: (
    settings: any,
  ) => Promise<{ success: boolean; message: string }>;
  checkAvailability: (
    email?: string,
    username?: string,
  ) => Promise<{ available: boolean; message: string }>;

  // OTP Authentication methods
  requestSignupOTP: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<{
    success: boolean;
    message: string;
    previewUrl?: string;
    devCode?: string;
    skipOTP?: boolean;
  }>;
  verifySignupOTP: (
    email: string,
    otp: string,
  ) => Promise<{ success: boolean; message: string }>;
  createUserAccount: (
    email: string,
    password: string,
    name: string,
    username: string,
    additionalData?: any,
  ) => Promise<{ success: boolean; message: string; user?: any }>;
  requestLoginOTP: (
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
  verifyLoginOTP: (
    email: string,
    otp: string,
  ) => Promise<{ success: boolean; message: string }>;

  // OAuth methods
  signInWithGoogle: (
    token: string,
  ) => Promise<{ success: boolean; message: string }>;
  signInWithFacebook: (
    token: string,
  ) => Promise<{ success: boolean; message: string }>;

  isAuthenticated: boolean;

  // Legacy methods for backward compatibility
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Safe fetch utility to prevent JSON parsing errors
  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      console.log(`🌐 Making request to: ${url}`, {
        method: options?.method || "GET",
        headers: options?.headers,
      });

      const response = await fetch(url, { credentials: "include", ...options });

      console.log(`📊 Response received:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      // Handle the response based on status
      if (!response.ok) {
        console.error(
          `❌ HTTP error for url: ${url}: ${response.status} ${response.statusText}`,
        );

        // Try to get error message from response (read as text first, then try to parse as JSON)
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              // If JSON parsing fails, use the raw text
              errorMessage = responseText;
            }
          }
        } catch (textError) {
          // Use default message if reading fails
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response as JSON
      let result;
      try {
        result = await response.json();
        console.log(`✅ Success response from ${url}:`, result);
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON response:`, parseError);
        throw new Error("Server returned invalid JSON response");
      }

      return result;
    } catch (error: any) {
      console.error(`🚨 Fetch error for ${url}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await loadUserProfile(token);
        return;
      }

      // Check cookies to avoid unnecessary 401s before login
      const cookie = typeof document !== "undefined" ? document.cookie : "";
      const hasAccess = /(?:^|; )auth_token=/.test(cookie);
      const hasRefresh = /(?:^|; )refresh_token=/.test(cookie);

      if (hasAccess) {
        const ok = await loadUserProfile();
        if (ok) return;
      }

      if (hasRefresh) {
        try {
          await safeFetch("/api/auth/refresh", { method: "POST" });
          await loadUserProfile();
          return;
        } catch {
          // ignore - user not logged in yet
        }
      }

      setUser(null);
    } catch (error) {
      // swallow init errors to prevent noisy logs pre-login
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (token?: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const result = await safeFetch("/api/auth/me", { headers });

      if (result.success && result.data) {
        setUser(result.data);
        console.log("✅ User profile loaded:", result.data);
        return true;
      } else {
        console.error("Auth endpoint returned error:", result);
        localStorage.removeItem("authToken");
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      localStorage.removeItem("authToken");
      setUser(null);
      return false;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { name, username } = userData;
      const result = await safeFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: name || userData.displayName || "User",
          username: username || userData.username || email.split("@")[0],
        }),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Account created successfully!",
        };
      } else {
        return { success: false, message: result.message || "Signup failed" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "Signup failed" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await safeFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Login successful!",
        };
      } else {
        return { success: false, message: result.message || "Login failed" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        // Call logout endpoint (don't throw errors on logout)
        try {
          await safeFetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          console.log("Logout endpoint error (non-critical):", error);
        }
      }

      localStorage.removeItem("authToken");
      setUser(null);
      console.log("✅ Successfully signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      // Still remove token even if endpoint fails
      localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const token = localStorage.getItem("authToken");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const result = await safeFetch("/api/auth/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });

      if (result.success) {
        // Update user state with the returned data
        setUser(result.data);
        return {
          success: true,
          message: result.message || "Profile updated successfully!",
        };
      }

      return { success: false, message: result.message || "Update failed" };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return { success: false, message: error.message || "Update failed" };
    }
  };

  const getSettings = async () => {
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const token = localStorage.getItem("authToken");

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const result = await safeFetch("/api/auth/settings", {
        headers,
      });

      return {
        success: result.success,
        data: result.data,
        message: result.message || "Settings retrieved successfully",
      };
    } catch (error: any) {
      console.error("Get settings error:", error);
      return {
        success: false,
        message: error.message || "Failed to get settings",
      };
    }
  };

  const updateSettings = async (settings: any) => {
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const token = localStorage.getItem("authToken");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const result = await safeFetch("/api/auth/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify(settings),
      });

      return {
        success: result.success,
        message: result.message || "Settings updated successfully",
      };
    } catch (error: any) {
      console.error("Update settings error:", error);
      return {
        success: false,
        message: error.message || "Failed to update settings",
      };
    }
  };

  // Legacy method compatibility
  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return {
      success: result.success,
      error: result.success ? undefined : result.message,
    };
  };

  const logout = async () => {
    await signOut();
  };

  const checkAvailability = async (email?: string, username?: string) => {
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (username) params.append("username", username);

      const result = await safeFetch(
        `/api/auth/check-availability?${params.toString()}`,
      );

      // Handle different response formats from backend
      let available = false;
      if (email && result.emailAvailable !== undefined) {
        available = result.emailAvailable;
      } else if (username && result.usernameAvailable !== undefined) {
        available = result.usernameAvailable;
      } else if (result.available !== undefined) {
        available = result.available;
      }

      return {
        available,
        message: result.message || (available ? "Available" : "Not available"),
      };
    } catch (error: any) {
      console.error("Availability check error:", error);
      return {
        available: false,
        message: error.message || "Failed to check availability",
      };
    }
  };

  // Request OTP for email signup using real email sending
  const requestSignupOTP = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    try {
      // Use real OTP endpoint that sends actual emails
      const normalizedEmail = (email || "").trim().toLowerCase();
      const result = await safeFetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name,
          username,
        }),
      });

      if (result.success) {
        console.log("📧 Real OTP email sent to:", email);
        return {
          success: true,
          message: "Verification code sent to your email",
          skipOTP: false,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to send verification code",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to send verification code",
      };
    }
  };

  const verifySignupOTP = async (email: string, otp: string) => {
    try {
      // Use real OTP verification endpoint
      const normalizedEmail = (email || "").trim().toLowerCase();
      const normalizedOTP = (otp || "").trim();
      const result = await safeFetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, otp: normalizedOTP }),
      });

      if (result.success) {
        console.log(
          "✅ Email verified and account created with JWT tokens:",
          email,
        );

        // JWT tokens and cookies are automatically set by the server
        // Set user data if provided
        if (result.user) {
          setUser(result.user);
        }

        return {
          success: true,
          message: "Email verified and account created successfully!",
          user: result.user,
        };
      } else {
        return {
          success: false,
          message: result.message || "Invalid verification code",
        };
      }
    } catch (error: any) {
      console.error("❌ Email verification error:", error);
      return {
        success: false,
        message: error.message || "Verification failed",
      };
    }
  };

  // Create account with complete user data (called after profile step)
  const createUserAccount = async (
    email: string,
    password: string,
    name: string,
    username: string,
    additionalData?: any,
  ) => {
    try {
      const requestData = {
        email,
        password,
        name,
        username,
        ...additionalData,
      };
      console.log("📤 Creating user account (JWT + cookies):", {
        ...requestData,
        password: "[HIDDEN]",
      });

      // Use MongoDB + JWT signup to set HTTP-only cookies and return token
      const result = await safeFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
        }
        if (result.data) {
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Account created successfully!",
          user: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || "Failed to create account",
        };
      }
    } catch (error: any) {
      console.error("❌ Account creation error:", error);
      return {
        success: false,
        message: error.message || "Failed to create account",
      };
    }
  };

  const requestLoginOTP = async (email: string) => {
    try {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const result = await safeFetch("/api/auth/login/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      return {
        success: result.success,
        message:
          result.message ||
          (result.success ? "OTP sent successfully" : "Failed to send OTP"),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to send OTP",
      };
    }
  };

  const verifyLoginOTP = async (email: string, otp: string) => {
    try {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const normalizedOTP = (otp || "").trim();
      const result = await safeFetch("/api/auth/login/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, otp: normalizedOTP }),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Login successful!",
        };
      } else {
        return {
          success: false,
          message: result.message || "OTP verification failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "OTP verification failed",
      };
    }
  };

  // OAuth methods
  const signInWithGoogle = async (token: string) => {
    try {
      const result = await safeFetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Google authentication successful!",
        };
      } else {
        return {
          success: false,
          message: result.message || "Google authentication failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Google authentication failed",
      };
    }
  };

  const signInWithFacebook = async (token: string) => {
    try {
      const result = await safeFetch("/api/auth/facebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (result.success) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
          setUser(result.data);
        }
        return {
          success: true,
          message: result.message || "Facebook authentication successful!",
        };
      } else {
        return {
          success: false,
          message: result.message || "Facebook authentication failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Facebook authentication failed",
      };
    }
  };

  const checkAuthState = async () => {
    await initializeAuth();
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getSettings,
    updateSettings,
    checkAvailability,
    requestSignupOTP,
    verifySignupOTP,
    createUserAccount,
    requestLoginOTP,
    verifyLoginOTP,
    signInWithGoogle,
    signInWithFacebook,
    isAuthenticated,
    login,
    logout,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

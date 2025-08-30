// OAuth Service for real Google and Facebook authentication
import { useAuth } from "../context/AuthContext";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface FacebookUser {
  id: string;
  email: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
  first_name?: string;
  last_name?: string;
}

class OAuthService {
  private googleLoaded = false;
  private facebookLoaded = false;

  // Initialize Google Sign-In
  async initializeGoogle(): Promise<boolean> {
    if (this.googleLoaded) return true;

    if (!GOOGLE_CLIENT_ID) {
      console.error("❌ Google Client ID not configured");
      console.error("🔧 Please set VITE_GOOGLE_CLIENT_ID environment variable");
      console.error("📝 See setup instructions in the console below:");
      console.error(`
🚀 GOOGLE OAUTH SETUP REQUIRED:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing project
3. Enable Google+ API and Google Sign-In API
4. Go to 'Credentials' → 'Create Credentials' → 'OAuth 2.0 Client ID'
5. Add these authorized origins:
   - http://localhost:8080
   - http://localhost:3000
   - Your production domain (when deployed)
6. Copy the Client ID and set it as environment variable:

   For development, create a .env file in your project root:
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

   Then restart your dev server: npm run dev
      `);
      return false;
    }

    try {
      console.log("🔄 Loading Google Identity Services...");
      console.log(
        "🔑 Using Google Client ID:",
        GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
      );

      // Load Google Sign-In script with retry mechanism
      await this.loadScript("https://accounts.google.com/gsi/client");

      // Wait for Google services to be available with timeout
      const waitForGoogle = new Promise<boolean>((resolve) => {
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total

        const checkGoogle = () => {
          attempts++;
          if (window.google?.accounts?.id) {
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(checkGoogle, 100);
          } else {
            resolve(false);
          }
        };

        checkGoogle();
      });

      const googleAvailable = await waitForGoogle;

      if (googleAvailable) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            console.log("Google Sign-In callback:", response);
          },
          auto_select: false,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid permission issues
        });

        this.googleLoaded = true;
        console.log("✅ Google Sign-In initialized successfully");
        return true;
      } else {
        console.error(
          "❌ Google Identity Services not available after timeout",
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to initialize Google Sign-In:", error);
      return false;
    }
  }

  // Initialize Facebook SDK
  async initializeFacebook(): Promise<boolean> {
    if (this.facebookLoaded) return true;

    if (!FACEBOOK_APP_ID) {
      console.warn("⚠️ Facebook App ID not configured");
      return false;
    }

    try {
      // Load Facebook SDK
      await this.loadScript("https://connect.facebook.net/en_US/sdk.js");

      // Initialize Facebook SDK
      if (window.FB) {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });

        this.facebookLoaded = true;
        console.log("✅ Facebook SDK initialized");
        return true;
      }
    } catch (error) {
      console.error("❌ Failed to initialize Facebook SDK:", error);
    }

    return false;
  }

  // Google Sign-In method
  async signInWithGoogle(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      const initialized = await this.initializeGoogle();
      if (!initialized) {
        return { success: false, error: "Google Sign-In not available" };
      }

      return new Promise((resolve) => {
        if (!window.google?.accounts?.oauth2) {
          resolve({ success: false, error: "Google OAuth2 not available" });
          return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID!,
          scope: "email profile",
          callback: (response: any) => {
            if (response.access_token) {
              // Get user profile data
              this.getGoogleUserProfile(response.access_token)
                .then((userProfile) => {
                  resolve({ success: true, token: response.access_token });
                })
                .catch((error) => {
                  resolve({ success: false, error: error.message });
                });
            } else {
              resolve({ success: false, error: "No access token received" });
            }
          },
          error_callback: (error: any) => {
            console.error("Google OAuth error:", error);
            resolve({
              success: false,
              error: error.message || "Google sign-in failed",
            });
          },
        });

        client.requestAccessToken();
      });
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);
      return {
        success: false,
        error: error.message || "Google sign-in failed",
      };
    }
  }

  // Real Facebook Sign-In method
  async signInWithFacebook(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      if (!FACEBOOK_APP_ID) {
        return {
          success: false,
          error:
            "Facebook App ID not configured. Please configure VITE_FACEBOOK_APP_ID environment variable.",
        };
      }

      const initialized = await this.initializeFacebook();
      if (!initialized) {
        return {
          success: false,
          error:
            "Failed to initialize Facebook SDK. Please check your internet connection.",
        };
      }

      return new Promise((resolve) => {
        window.FB.login(
          (response: any) => {
            if (response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              resolve({ success: true, token: accessToken });
            } else {
              resolve({
                success: false,
                error: "Facebook login was cancelled or failed",
              });
            }
          },
          { scope: "email,public_profile" },
        );
      });
    } catch (error: any) {
      console.error("❌ Facebook sign-in error:", error);
      return {
        success: false,
        error: error.message || "Facebook sign-in failed",
      };
    }
  }

  // Get Google user profile
  private async getGoogleUserProfile(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
    );
    if (!response.ok) {
      throw new Error("Failed to get Google user profile");
    }
    return response.json();
  }

  // Get Facebook user profile
  private async getFacebookUserProfile(): Promise<FacebookUser> {
    return new Promise((resolve, reject) => {
      window.FB.api(
        "/me",
        { fields: "id,name,email,picture.type(large),first_name,last_name" },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  // Load external script with retry mechanism
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        console.log(`✅ Script already loaded: ${src}`);
        resolve();
        return;
      }

      console.log(`🔄 Loading script: ${src}`);

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;

      // Add timeout for script loading
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`Script loading timeout: ${src}`));
      }, 10000); // 10 second timeout

      script.onload = () => {
        clearTimeout(timeout);
        console.log(`✅ Script loaded successfully: ${src}`);
        resolve();
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        script.remove();
        console.error(`❌ Script loading failed: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  // Real Google Sign-In using ID Token
  async signInWithGoogleIdToken(): Promise<{
    success: boolean;
    idToken?: string;
    error?: string;
  }> {
    try {
      const isDev = import.meta.env.DEV;

      if (!GOOGLE_CLIENT_ID) {
        if (isDev) {
          // Dev fallback when not configured
          return { success: true, idToken: `dev_mock_${Date.now()}` };
        }
        return {
          success: false,
          error:
            "Google Client ID not configured. Please configure VITE_GOOGLE_CLIENT_ID environment variable.",
        };
      }

      console.log("🔄 Attempting Google Sign-In initialization...");
      const initialized = await this.initializeGoogle();

      if (!initialized) {
        console.error("❌ Google Sign-In initialization failed");
        if (isDev) {
          // Likely origin not authorized or GSI blocked; use mock in dev
          return { success: true, idToken: `dev_mock_${Date.now()}` };
        }
        return {
          success: false,
          error:
            "Failed to initialize Google Sign-In. This could be due to:\n• Network connectivity issues\n• Browser blocking third-party scripts\n• Google services being temporarily unavailable\n\nPlease try refreshing the page or check your internet connection.",
        };
      }

      console.log(
        "✅ Google Sign-In initialized, proceeding with authentication...",
      );

      return new Promise((resolve) => {
        const resolveWithDevMock = () =>
          resolve({ success: true, idToken: `dev_mock_${Date.now()}` });

        if (!window.google?.accounts?.id) {
          if (isDev) return resolveWithDevMock();
          resolve({
            success: false,
            error:
              "Google Identity Services not available. Please refresh the page and try again.",
          });
          return;
        }

        // Set up callback for Google Sign-In
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID!,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid permission issues
          callback: (response: any) => {
            if (response.credential) {
              resolve({ success: true, idToken: response.credential });
            } else if (isDev) {
              resolveWithDevMock();
            } else {
              resolve({
                success: false,
                error: "No credential received from Google",
              });
            }
          },
        });

        // Try to prompt for sign-in
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            if (isDev) return resolveWithDevMock();
            // Show manual sign-in button
            this.showGoogleSignInButton(resolve);
          }
        });
      });
    } catch (error: any) {
      console.error("❌ Google ID token sign-in error:", error);
      const isDev = import.meta.env.DEV;
      if (isDev) {
        return { success: true, idToken: `dev_mock_${Date.now()}` };
      }
      return {
        success: false,
        error: error.message || "Google sign-in failed",
      };
    }
  }

  // Show Google Sign-In button as fallback
  private showGoogleSignInButton(
    resolve: (value: {
      success: boolean;
      idToken?: string;
      error?: string;
    }) => void,
  ) {
    const buttonContainer =
      document.getElementById("google-signin-button") ||
      document.createElement("div");
    if (!document.getElementById("google-signin-button")) {
      buttonContainer.id = "google-signin-button";
      document.body.appendChild(buttonContainer);
    }

    window.google!.accounts.id.renderButton(buttonContainer, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      callback: (response: any) => {
        if (response.credential) {
          resolve({ success: true, idToken: response.credential });
        } else {
          resolve({
            success: false,
            error: "No credential received from Google",
          });
        }
        buttonContainer.remove();
      },
    });
  }
}

// Create singleton instance
export const oauthService = new OAuthService();

// Initialize services when module loads (with error handling)
if (typeof window !== "undefined") {
  // Pre-load Google Sign-In when the module loads
  oauthService.initializeGoogle().catch((error) => {
    console.warn("⚠️ Pre-loading Google Sign-In failed:", error.message);
  });

  // Pre-load Facebook SDK when the module loads
  oauthService.initializeFacebook().catch((error) => {
    console.warn("⚠️ Pre-loading Facebook SDK failed:", error.message);
  });
}

// Type declarations for window objects
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2?: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    FB?: {
      init: (config: any) => void;
      login: (callback: (response: any) => void, options?: any) => void;
      api: (
        path: string,
        params: any,
        callback: (response: any) => void,
      ) => void;
    };
  }
}

import { User } from "firebase/auth";

// Enhanced user interface that combines Firebase + MongoDB + localStorage data
export interface EnhancedUserData {
  // Firebase fields
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string;
  creationTime: string;
  lastSignInTime: string;

  // MongoDB/Signup fields
  username: string;
  name: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  website?: string;

  // Profile data
  profileImageURL: string;
  avatar: string;

  // Account status
  isVerified: boolean;
  isPremium: boolean;
  accountType: "Free" | "Premium";
  memberSince: string;

  // Social stats
  followersCount: number;
  followingCount: number;

  // Settings
  isArtist: boolean;
  isPublic: boolean;

  // Source tracking
  dataSource: "localStorage" | "firebase" | "mongodb" | "mixed";
}

export class UserDataService {
  private static instance: UserDataService;

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  /**
   * Fetch comprehensive user data from all available sources with optimized flow
   */
  async fetchUserData(firebaseUser: User): Promise<EnhancedUserData | null> {
    if (!firebaseUser) {
      return null;
    }

    // Start with Firebase base data
    let userData: EnhancedUserData = this.createBaseUserData(firebaseUser);

    // 1. Try localStorage first (fastest)
    const localData = this.loadFromLocalStorage(firebaseUser.uid);
    if (localData) {
      userData = { ...userData, ...localData, dataSource: "localStorage" };

      // If we have fresh cached data, return immediately
      if (!this.isDataStale(firebaseUser.uid, 10)) {
        // 10 minutes cache
        return userData;
      }
    }

    // 2. Try MongoDB backend with timeout and fast fallback
    try {
      const mongoDataPromise = this.loadFromMongoDB(firebaseUser.uid);
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000); // 3 second timeout
      });

      const mongoData = await Promise.race([mongoDataPromise, timeoutPromise]);

      if (mongoData) {
        userData = {
          ...userData,
          ...mongoData,
          dataSource:
            userData.dataSource === "localStorage" ? "mixed" : "mongodb",
        };
        // Save successful fetch to cache
        this.saveToLocalStorage(userData);
      } else {
        // User doesn't exist in backend, try to create it
        console.log("🔥 User not found in backend, creating...");
        await this.createUserInBackend(firebaseUser, userData);
      }
    } catch (error) {
      // MongoDB fetch failed, continue with cached data
      console.warn("⚠️ MongoDB fetch failed, using cached data");
    }

    return userData;
  }

  /**
   * Create base user data from Firebase user
   */
  private createBaseUserData(firebaseUser: User): EnhancedUserData {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      emailVerified: firebaseUser.emailVerified,
      displayName:
        firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      photoURL: firebaseUser.photoURL || "",
      creationTime:
        firebaseUser.metadata.creationTime || new Date().toISOString(),
      lastSignInTime:
        firebaseUser.metadata.lastSignInTime || new Date().toISOString(),

      // Derived fields
      username: firebaseUser.email?.split("@")[0] || "user",
      name:
        firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      profileImageURL: firebaseUser.photoURL || "",
      avatar: firebaseUser.photoURL || "",

      // Default values
      bio: "",
      phone: firebaseUser.phoneNumber || "",
      dateOfBirth: "",
      gender: "",
      country: "",
      city: "",
      address: "",
      zipCode: "",
      website: "",

      isVerified: firebaseUser.emailVerified,
      isPremium: false,
      accountType: "Free",
      memberSince: this.formatDate(firebaseUser.metadata.creationTime),

      followersCount: 0,
      followingCount: 0,

      isArtist: false,
      isPublic: true,

      dataSource: "firebase",
    };
  }

  /**
   * Create user in backend when they don't exist
   */
  private async createUserInBackend(
    firebaseUser: User,
    userData: EnhancedUserData,
  ): Promise<void> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          username: userData.username,
          name: userData.name,
          password: "firebase_user_temp_password_" + Math.random().toString(36),
          profileImageURL: userData.profileImageURL,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          bio: userData.bio,
          provider: "firebase",
          socialSignup: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ User created in backend via user data service:", result);
      } else {
        console.warn("⚠️ Failed to create user in backend:", response.status);
      }
    } catch (error) {
      console.warn("⚠️ Error creating user in backend:", error);
    }
  }

  /**
   * Load user data from localStorage
   */
  private loadFromLocalStorage(uid: string): Partial<EnhancedUserData> | null {
    try {
      // Check multiple localStorage keys for user data
      const keys = ["currentUser", `firebase_account_${uid}`, "userProfile"];

      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const userData = JSON.parse(data);
          if (userData && (userData.uid === uid || userData.id === uid)) {
            return {
              name: userData.name || userData.displayName || userData.fullName,
              username: userData.username,
              bio: userData.bio,
              phone: userData.phone,
              dateOfBirth: userData.dateOfBirth || userData.dob,
              gender: userData.gender,
              country: userData.country,
              city: userData.city,
              address: userData.address,
              zipCode: userData.zipCode || userData.zip_code,
              website: userData.website,
              profileImageURL:
                userData.profileImageURL ||
                userData.avatar ||
                userData.profileImage,
              avatar:
                userData.profileImageURL ||
                userData.avatar ||
                userData.profileImage,
              isPremium: userData.premium || userData.isPremium || false,
              accountType:
                userData.premium || userData.isPremium ? "Premium" : "Free",
            };
          }
        }
      }

      // Also check userAvatar separately
      const avatarData = localStorage.getItem("userAvatar");
      if (avatarData) {
        return { avatar: avatarData, profileImageURL: avatarData };
      }

      return null;
    } catch (error) {
      console.warn("⚠️ Failed to load localStorage data:", error);
      return null;
    }
  }

  /**
   * Load user data from MongoDB backend with optimized error handling
   */
  private async loadFromMongoDB(
    uid: string,
  ): Promise<Partial<EnhancedUserData> | null> {
    try {
      // Try primary endpoint first with faster timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      try {
        const response = await fetch(`/api/v1/users/${uid}`, {
          headers: {
            "user-id": uid,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const mongoData = result.data;

            return {
              name:
                mongoData.display_name || mongoData.name || mongoData.full_name,
              username: mongoData.username,
              bio: mongoData.bio,
              phone: mongoData.phone,
              dateOfBirth: mongoData.date_of_birth || mongoData.dob,
              gender: mongoData.gender,
              country: mongoData.country,
              city: mongoData.city,
              address: mongoData.address,
              zipCode: mongoData.zip_code,
              website: mongoData.website,
              profileImageURL: mongoData.profile_image_url,
              avatar: mongoData.profile_image_url,
              isVerified: mongoData.is_verified || mongoData.verified,
              isPremium: mongoData.is_premium || mongoData.premium,
              accountType:
                mongoData.is_premium || mongoData.premium ? "Premium" : "Free",
              followersCount:
                mongoData.follower_count || mongoData.followers_count || 0,
              followingCount: mongoData.following_count || 0,
              isArtist: mongoData.is_artist || false,
              isPublic: mongoData.is_public !== false, // Default to true
              memberSince: mongoData.created_at
                ? this.formatDate(mongoData.created_at)
                : undefined,
            };
          }
        } else if (response.status === 404) {
          // User not found in MongoDB, that's ok - use Firebase/local data
          return null;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Network error or timeout, fallback to cached data
        return null;
      }

      return null;
    } catch (error) {
      // Silent fallback - don't log 404s as errors
      return null;
    }
  }

  /**
   * Save user data to localStorage for caching
   */
  private saveToLocalStorage(userData: EnhancedUserData): void {
    try {
      const cacheData = {
        uid: userData.uid,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        country: userData.country,
        city: userData.city,
        address: userData.address,
        zipCode: userData.zipCode,
        website: userData.website,
        profileImageURL: userData.profileImageURL,
        avatar: userData.avatar,
        isPremium: userData.isPremium,
        accountType: userData.accountType,
        isVerified: userData.isVerified,
        memberSince: userData.memberSince,
        lastUpdated: new Date().toISOString(),
      };

      // Save to multiple keys for compatibility
      localStorage.setItem("currentUser", JSON.stringify(cacheData));
      localStorage.setItem(
        `firebase_account_${userData.uid}`,
        JSON.stringify(cacheData),
      );

      if (userData.avatar) {
        localStorage.setItem("userAvatar", userData.avatar);
      }
    } catch (error) {
      console.warn("⚠️ Failed to save to localStorage:", error);
    }
  }

  /**
   * Update user data (saves to all available backends)
   */
  async updateUserData(
    uid: string,
    updates: Partial<EnhancedUserData>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update localStorage immediately for responsiveness
      const localData = this.loadFromLocalStorage(uid);
      if (localData) {
        const updatedData = { ...localData, ...updates };
        this.saveToLocalStorage(updatedData as EnhancedUserData);
      }

      // Try to update MongoDB backend
      try {
        const response = await fetch(`/api/v1/users/${uid}`, {
          method: "PUT",
          headers: {
            "user-id": uid,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display_name: updates.name,
            username: updates.username,
            bio: updates.bio,
            phone: updates.phone,
            date_of_birth: updates.dateOfBirth,
            gender: updates.gender,
            country: updates.country,
            city: updates.city,
            address: updates.address,
            zip_code: updates.zipCode,
            website: updates.website,
            profile_image_url: updates.profileImageURL,
          }),
        });

        if (response.ok) {
          // MongoDB update successful
        } else {
          // MongoDB update failed, continuing with local updates
        }
      } catch (mongoError) {
        // MongoDB update error, continuing with local updates
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Update user data error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  }

  /**
   * Clear all user data (logout)
   */
  clearUserData(): void {
    try {
      const keysToRemove = [
        "currentUser",
        "userAvatar",
        "token",
        "refreshToken",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Remove Firebase-specific keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("firebase_account_")) {
          localStorage.removeItem(key);
        }
      });

      // User data cleared
    } catch (error) {
      console.warn("⚠️ Failed to clear user data:", error);
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateInput: string | undefined): string {
    if (!dateInput) return "Unknown";

    try {
      const date = new Date(dateInput);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "Unknown";
    }
  }

  /**
   * Get user data synchronously from cache
   */
  getCachedUserData(uid: string): EnhancedUserData | null {
    const localData = this.loadFromLocalStorage(uid);
    return localData as EnhancedUserData | null;
  }

  /**
   * Check if user data is stale and needs refresh
   */
  isDataStale(uid: string, maxAgeMinutes: number = 30): boolean {
    try {
      const data = localStorage.getItem("currentUser");
      if (!data) return true;

      const userData = JSON.parse(data);
      if (!userData.lastUpdated || userData.uid !== uid) return true;

      const lastUpdated = new Date(userData.lastUpdated);
      const now = new Date();
      const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

      return ageMinutes > maxAgeMinutes;
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const userDataService = UserDataService.getInstance();

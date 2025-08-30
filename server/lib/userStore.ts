// Shared user store for authentication and profile data

// Profile users map (for /api/v1/users endpoints)
export const profileUsers = new Map();

// Auth users map (for /api/auth endpoints)
export const authUsers = new Map();

// User relationships
export const userFollows = new Map<string, Set<string>>();

// Function to sync user data between auth and profile systems
export const syncUserData = (userId: string, authData: any, profileData?: any) => {
  // Update auth user
  authUsers.set(userId, authData);
  authUsers.set(authData.email, authData);
  authUsers.set(authData.username, authData);

  // Update or create profile user
  if (profileData) {
    profileUsers.set(userId, profileData);
  } else {
    // Create profile from auth data
    const profile = {
      id: authData.id,
      email: authData.email,
      username: authData.username,
      display_name: authData.name || authData.username,
      profile_image_url: authData.profile_image_url || "",
      bio: authData.bio || "New to Music Catch! 🎵",
      country: authData.country || "",
      date_of_birth: authData.date_of_birth || "",
      gender: authData.gender || "",
      is_verified: authData.is_verified || false,
      is_artist: false,
      is_active: true,
      follower_count: 0,
      following_count: 0,
      created_at: authData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    profileUsers.set(userId, profile);
  }
};

// Function to get user by any identifier
export const getUserByIdentifier = (identifier: string) => {
  return authUsers.get(identifier);
};

// Function to create new user in both systems
export const createUser = (userData: any) => {
  const userId = userData.id || `user${Date.now()}`;
  const user = {
    id: userId,
    ...userData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  syncUserData(userId, user);
  return { data: user, error: null };
};

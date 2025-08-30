import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  email: string;
  joinDate: string;
  isVerified: boolean;
  followers: number;
  following: number;
  likedSongs: string[];
  recentlyPlayed: string[];
  playlists: Playlist[];
  musicPreferences: MusicPreferences;
  socialLinks: SocialLinks;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  songs: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface MusicPreferences {
  favoriteGenres: string[];
  favoriteArtists: string[];
  mood: string;
  language: string[];
  autoPlay?: boolean;
  crossfade?: boolean;
  soundQuality?: "low" | "medium" | "high" | "lossless";
}

export interface SocialLinks {
  twitter?: string;
  website?: string;
  musicPlatform?: string;
  socialPlatform?: string;
}

interface ProfileContextType {
  profile: UserProfile;
  isEditing: boolean;
  isLoading: boolean;
  editedProfile: Partial<UserProfile>;
  setProfile: (profile: UserProfile) => void;
  setIsEditing: (editing: boolean) => void;
  updateEditedProfile: (updates: Partial<UserProfile>) => void;
  saveProfile: () => Promise<void>;
  cancelEditing: () => void;
  uploadProfilePicture: (file: File) => Promise<string>;
  addLikedSong: (songId: string) => Promise<void>;
  removeLikedSong: (songId: string) => Promise<void>;
  toggleLikedSong: (songId: string) => Promise<void>;
  loadProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    id: "user1",
    username: "biospectra",
    displayName: "Bio Spectra",
    bio: "Music lover 🎵 | Producer | Always discovering new sounds ✨",
    profilePicture:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=biospectra&size=300",
    email: "bio.spectra@musiccatch.com",
    joinDate: "2023-01-15",
    isVerified: true,
    followers: 1248,
    following: 567,
    likedSongs: ["song1", "song2", "song3"],
    recentlyPlayed: ["song1", "song2", "song3"],
    playlists: [],
    musicPreferences: {
      favoriteGenres: ["Electronic", "Indie", "Alternative", "Lo-fi"],
      favoriteArtists: ["The Weeknd", "Daft Punk", "Tame Impala", "ODESZA"],
      mood: "Chill",
      language: ["English", "French"],
      autoPlay: true,
      crossfade: false,
      soundQuality: "high" as "high",
    },
    socialLinks: {
      twitter: "@biospectramusic",
      website: "biospectra.com",
      musicPlatform: "biospectra",
    },
  });

  // Additional user settings not part of the main profile
  const [userSettings] = useState({
    subscription: {
      plan: "premium",
      status: "active",
      startDate: "2023-01-15",
      features: [
        "Unlimited skips",
        "Ad-free listening",
        "High-quality audio",
        "Offline downloads",
      ],
      autoRenew: true,
    },
    settings: {
      theme: "dark",
      language: "en",
      notifications: {
        email: true,
        push: true,
        newFollowers: true,
        newMusic: true,
        recommendations: true,
        socialActivity: false,
      },
      privacy: {
        profileVisibility: "public",
        showRecentlyPlayed: true,
        showLikedSongs: true,
        showPlaylists: true,
        allowFollowers: true,
      },
      playback: {
        volume: 80,
        shuffle: false,
        repeat: "off",
        gaplessPlayback: true,
        normalization: true,
      },
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.profile.getProfile();
      if (response.success && response.profile) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEditedProfile = (updates: Partial<UserProfile>) => {
    setEditedProfile((prev) => ({ ...prev, ...updates }));
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.profile.updateProfile(editedProfile);

      if (response.success && response.profile) {
        setProfile(response.profile);
        setEditedProfile({});
        setIsEditing(false);

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditedProfile({});
    setIsEditing(false);
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await api.upload.uploadProfilePicture(file);

      if (response.success && response.url) {
        // Update both the edited profile and main profile state immediately
        updateEditedProfile({ profilePicture: response.url });
        setProfile((prev) => ({ ...prev, profilePicture: response.url }));

        toast({
          title: "Success",
          description: "Profile picture uploaded successfully",
        });

        return response.url;
      }

      throw new Error("Upload failed");
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addLikedSong = async (songId: string) => {
    try {
      if (!profile.likedSongs.includes(songId)) {
        await api.profile.toggleLikedSong(songId);
        const updatedLikedSongs = [...profile.likedSongs, songId];
        setProfile((prev) => ({ ...prev, likedSongs: updatedLikedSongs }));

        toast({
          title: "Added to liked songs",
          description: "Song added to your liked songs",
        });
      }
    } catch (error) {
      console.error("Failed to add liked song:", error);
      toast({
        title: "Error",
        description: "Failed to add song to liked songs",
        variant: "destructive",
      });
    }
  };

  const removeLikedSong = async (songId: string) => {
    try {
      await api.profile.toggleLikedSong(songId);
      const updatedLikedSongs = profile.likedSongs.filter(
        (id) => id !== songId,
      );
      setProfile((prev) => ({ ...prev, likedSongs: updatedLikedSongs }));

      toast({
        title: "Removed from liked songs",
        description: "Song removed from your liked songs",
      });
    } catch (error) {
      console.error("Failed to remove liked song:", error);
      toast({
        title: "Error",
        description: "Failed to remove song from liked songs",
        variant: "destructive",
      });
    }
  };

  const toggleLikedSong = async (songId: string) => {
    if (profile.likedSongs.includes(songId)) {
      await removeLikedSong(songId);
    } else {
      await addLikedSong(songId);
    }
  };

  const value: ProfileContextType = {
    profile,
    isEditing,
    isLoading,
    editedProfile,
    setProfile,
    setIsEditing,
    updateEditedProfile,
    saveProfile,
    cancelEditing,
    uploadProfilePicture,
    addLikedSong,
    removeLikedSong,
    toggleLikedSong,
    loadProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

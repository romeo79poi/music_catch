import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Save,
  X,
  Upload,
  User,
  Heart,
  Music,
  Globe,
  Lock,
  Twitter,
  Loader2,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../context/ProfileContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function EditProfile() {
  const navigate = useNavigate();
  const {
    profile,
    editedProfile,
    updateEditedProfile,
    saveProfile,
    cancelEditing,
    uploadProfilePicture,
  } = useProfileContext();

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = { ...profile, ...editedProfile };

  // Reset image error when profile picture URL changes
  React.useEffect(() => {
    setImageLoadError(false);
  }, [currentProfile.profilePicture]);

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation before upload
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (file.size > maxSize) {
      // Use toast from context for consistency
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      // Use toast from context for consistency
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePicture(file);
    } catch (error) {
      // Error is already handled by ProfileContext with toast notification
    } finally {
      setIsUploading(false);
      // Clear the input to allow re-selecting the same file if needed
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile();
      navigate("/profile");
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    cancelEditing();
    navigate(-1);
  };

  const addGenre = () => {
    if (
      newGenre.trim() &&
      !currentProfile.musicPreferences.favoriteGenres.includes(newGenre.trim())
    ) {
      updateEditedProfile({
        musicPreferences: {
          ...currentProfile.musicPreferences,
          favoriteGenres: [
            ...currentProfile.musicPreferences.favoriteGenres,
            newGenre.trim(),
          ],
        },
      });
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    updateEditedProfile({
      musicPreferences: {
        ...currentProfile.musicPreferences,
        favoriteGenres: currentProfile.musicPreferences.favoriteGenres.filter(
          (g) => g !== genre,
        ),
      },
    });
  };

  const addArtist = () => {
    if (
      newArtist.trim() &&
      !currentProfile.musicPreferences.favoriteArtists.includes(
        newArtist.trim(),
      )
    ) {
      updateEditedProfile({
        musicPreferences: {
          ...currentProfile.musicPreferences,
          favoriteArtists: [
            ...currentProfile.musicPreferences.favoriteArtists,
            newArtist.trim(),
          ],
        },
      });
      setNewArtist("");
    }
  };

  const removeArtist = (artist: string) => {
    updateEditedProfile({
      musicPreferences: {
        ...currentProfile.musicPreferences,
        favoriteArtists: currentProfile.musicPreferences.favoriteArtists.filter(
          (a) => a !== artist,
        ),
      },
    });
  };

  const addLanguage = () => {
    if (
      newLanguage.trim() &&
      !currentProfile.musicPreferences.language.includes(newLanguage.trim())
    ) {
      updateEditedProfile({
        musicPreferences: {
          ...currentProfile.musicPreferences,
          language: [
            ...currentProfile.musicPreferences.language,
            newLanguage.trim(),
          ],
        },
      });
      setNewLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    updateEditedProfile({
      musicPreferences: {
        ...currentProfile.musicPreferences,
        language: currentProfile.musicPreferences.language.filter(
          (l) => l !== language,
        ),
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 pt-12"
        >
          <button
            onClick={handleCancel}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-neon-green to-neon-blue rounded-full font-semibold text-black disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </motion.div>

        {/* Content */}
        <div className="px-6 pb-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 rounded-xl p-1">
              <TabsTrigger value="basic" className="rounded-lg">
                Basic
              </TabsTrigger>
              <TabsTrigger value="music" className="rounded-lg">
                Music
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-lg">
                Social
              </TabsTrigger>
            </TabsList>

            {/* Basic Profile Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Profile Picture */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-neon-green to-neon-blue rounded-full p-1">
                    <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                      {currentProfile.profilePicture && !imageLoadError ? (
                        <img
                          src={currentProfile.profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error(
                              "Failed to load profile image:",
                              currentProfile.profilePicture,
                            );
                            setImageLoadError(true);
                          }}
                          onLoad={() => {
                            console.log("Profile image loaded successfully");
                            setImageLoadError(false);
                          }}
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center text-black"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Tap to change profile picture
                </p>
              </motion.div>

              {/* Basic Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <Input
                    value={currentProfile.displayName}
                    onChange={(e) =>
                      updateEditedProfile({ displayName: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <Input
                    value={currentProfile.username}
                    onChange={(e) =>
                      updateEditedProfile({ username: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <Textarea
                    value={currentProfile.bio}
                    onChange={(e) =>
                      updateEditedProfile({ bio: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white resize-none"
                    placeholder="Tell the world about yourself..."
                    rows={3}
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {currentProfile.bio.length}/150 characters
                  </p>
                </div>
              </motion.div>
            </TabsContent>

            {/* Music Preferences Tab */}
            <TabsContent value="music" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Favorite Genres */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Favorite Genres
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentProfile.musicPreferences.favoriteGenres.map(
                      (genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="bg-neon-green/20 text-neon-green border-neon-green/50 pr-1"
                        >
                          {genre}
                          <button
                            onClick={() => removeGenre(genre)}
                            className="ml-2 hover:bg-red-500/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ),
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      className="bg-white/5 border-white/10 text-white flex-1"
                      placeholder="Add a genre..."
                      onKeyPress={(e) => e.key === "Enter" && addGenre()}
                    />
                    <Button
                      onClick={addGenre}
                      className="bg-neon-green/20 text-neon-green border-neon-green/50"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Favorite Artists */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Favorite Artists
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentProfile.musicPreferences.favoriteArtists.map(
                      (artist) => (
                        <Badge
                          key={artist}
                          variant="secondary"
                          className="bg-neon-blue/20 text-neon-blue border-neon-blue/50 pr-1"
                        >
                          {artist}
                          <button
                            onClick={() => removeArtist(artist)}
                            className="ml-2 hover:bg-red-500/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ),
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      className="bg-white/5 border-white/10 text-white flex-1"
                      placeholder="Add an artist..."
                      onKeyPress={(e) => e.key === "Enter" && addArtist()}
                    />
                    <Button
                      onClick={addArtist}
                      className="bg-neon-blue/20 text-neon-blue border-neon-blue/50"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Music Languages
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentProfile.musicPreferences.language.map(
                      (language) => (
                        <Badge
                          key={language}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-400 border-purple-500/50 pr-1"
                        >
                          {language}
                          <button
                            onClick={() => removeLanguage(language)}
                            className="ml-2 hover:bg-red-500/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ),
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="bg-white/5 border-white/10 text-white flex-1"
                      placeholder="Add a language..."
                      onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                    />
                    <Button
                      onClick={addLanguage}
                      className="bg-purple-500/20 text-purple-400 border-purple-500/50"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Current Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Music Mood
                  </label>
                  <Input
                    value={currentProfile.musicPreferences.mood}
                    onChange={(e) =>
                      updateEditedProfile({
                        musicPreferences: {
                          ...currentProfile.musicPreferences,
                          mood: e.target.value,
                        },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g., Chill, Energetic, Melancholic..."
                  />
                </div>
              </motion.div>
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Website
                  </label>
                  <Input
                    value={currentProfile.socialLinks.website || ""}
                    onChange={(e) =>
                      updateEditedProfile({
                        socialLinks: {
                          ...currentProfile.socialLinks,
                          website: e.target.value,
                        },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                    Twitter
                  </label>
                  <Input
                    value={currentProfile.socialLinks.twitter || ""}
                    onChange={(e) =>
                      updateEditedProfile({
                        socialLinks: {
                          ...currentProfile.socialLinks,
                          twitter: e.target.value,
                        },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Music className="w-4 h-4 mr-2 text-purple-500" />
                    Music Platform
                  </label>
                  <Input
                    value={currentProfile.socialLinks.musicPlatform || ""}
                    onChange={(e) =>
                      updateEditedProfile({
                        socialLinks: {
                          ...currentProfile.socialLinks,
                          musicPlatform: e.target.value,
                        },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Music className="w-4 h-4 mr-2 text-gray-400" />
                    Apple Music
                  </label>
                  <Input
                    value={currentProfile.socialLinks.appleMusic || ""}
                    onChange={(e) =>
                      updateEditedProfile({
                        socialLinks: {
                          ...currentProfile.socialLinks,
                          appleMusic: e.target.value,
                        },
                      })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="username"
                  />
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

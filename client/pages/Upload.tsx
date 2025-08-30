import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload as UploadIcon,
  Music,
  Image,
  Mic,
  Play,
  Pause,
  Volume2,
  Clock,
  Users,
  Globe,
  Lock,
  Check,
  X,
  Plus,
  Loader2,
  Star,
  TrendingUp,
  Calendar,
  Tag,
  FileAudio,
  Camera,
  Settings,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import MobileFooter from "../components/MobileFooter";
import { useFirebase } from "../context/FirebaseContext";
import { uploadApi } from "../lib/api";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  duration?: number;
  preview?: string;
}

interface TrackInfo {
  title: string;
  genre: string;
  description: string;
  tags: string[];
  isExplicit: boolean;
  visibility: "public" | "private" | "unlisted";
  allowDownloads: boolean;
  allowComments: boolean;
  releaseDate?: Date;
  collaborators: string[];
  credits: {
    producer?: string;
    writer?: string;
    mixer?: string;
    masterer?: string;
  };
}

const genres = [
  "Pop",
  "Hip-Hop",
  "Rock",
  "Electronic",
  "R&B",
  "Jazz",
  "Classical",
  "Country",
  "Reggae",
  "Blues",
  "Folk",
  "Punk",
  "Metal",
  "House",
  "Techno",
  "Dubstep",
  "Trap",
  "Lo-Fi",
  "Ambient",
  "Indie",
];

const popularTags = [
  "chill",
  "upbeat",
  "romantic",
  "sad",
  "party",
  "workout",
  "study",
  "relaxing",
  "energetic",
  "emotional",
  "nostalgic",
  "dreamy",
];

export default function Upload() {
  const navigate = useNavigate();
  const { user: firebaseUser } = useFirebase();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");

  const [trackInfo, setTrackInfo] = useState<TrackInfo>({
    title: "",
    genre: "",
    description: "",
    tags: [],
    isExplicit: false,
    visibility: "public",
    allowDownloads: true,
    allowComments: true,
    releaseDate: undefined,
    collaborators: [],
    credits: {},
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadedFile({
              id: Date.now().toString(),
              name: file.name,
              size: file.size,
              duration: 180, // Mock duration
              preview: URL.createObjectURL(file),
            });
            setDuration(180);
            setCurrentStep(2);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
    }
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !trackInfo.tags.includes(tagInput.trim())) {
      setTrackInfo((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTrackInfo((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addCollaborator = () => {
    if (
      collaboratorInput.trim() &&
      !trackInfo.collaborators.includes(collaboratorInput.trim())
    ) {
      setTrackInfo((prev) => ({
        ...prev,
        collaborators: [...prev.collaborators, collaboratorInput.trim()],
      }));
      setCollaboratorInput("");
    }
  };

  const removeCollaborator = (collaborator: string) => {
    setTrackInfo((prev) => ({
      ...prev,
      collaborators: prev.collaborators.filter((c) => c !== collaborator),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handlePublish = async () => {
    if (!trackInfo.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please add a title for your track",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to publish tracks",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Try backend publish API, fallback to demo
      try {
        const publishData = {
          ...trackInfo,
          fileId: uploadedFile?.id,
          coverImage: coverImage,
          duration: duration,
        };

        const response = await fetch("/api/tracks/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(publishData),
        });

        if (response.ok) {
          const result = await response.json();
          toast({
            title: "Track published successfully!",
            description: "Your music is now live on Catch Music",
          });
          console.log("✅ Track published to backend:", result);
          navigate("/profile");
        } else {
          throw new Error("Backend publish failed");
        }
      } catch (backendError) {
        console.error("Backend publish failed, using demo mode:", backendError);
        // Fallback to demo publishing
        setTimeout(() => {
          toast({
            title: "Track published! (Demo Mode)",
            description: "Your track has been processed locally",
          });
          navigate("/profile");
        }, 2000);
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const steps = [
    { number: 1, title: "Upload", description: "Upload your audio file" },
    { number: 2, title: "Details", description: "Add track information" },
    { number: 3, title: "Publish", description: "Review and publish" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6"></div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-purple-primary/20"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-purple-dark/50 backdrop-blur-sm flex items-center justify-center border border-purple-primary/30"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>

            <div>
              <h1 className="text-xl font-bold text-white">Upload Music</h1>
              <p className="text-sm text-gray-400">Share your creativity</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep >= step.number
                      ? "bg-purple-primary text-white"
                      : "bg-purple-dark/50 text-gray-400"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 transition-colors ${
                      currentStep > step.number
                        ? "bg-purple-primary"
                        : "bg-purple-dark/50"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Upload Your Track
                  </h2>
                  <p className="text-gray-400">
                    Supported formats: MP3, WAV, FLAC (Max 100MB)
                  </p>
                </div>

                {!uploadedFile ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-primary/50 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-primary transition-colors"
                  >
                    {isUploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-16 h-16 text-purple-primary mx-auto animate-spin" />
                        <div className="space-y-2">
                          <p className="text-white font-medium">Uploading...</p>
                          <div className="w-full bg-purple-dark/50 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-purple-primary to-purple-secondary h-2 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-400">
                            {Math.round(uploadProgress)}% complete
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <UploadIcon className="w-16 h-16 text-purple-primary mx-auto" />
                        <div>
                          <p className="text-xl font-semibold text-white mb-2">
                            Drop your track here
                          </p>
                          <p className="text-gray-400">
                            or click to browse files
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-purple-primary/20 rounded-xl flex items-center justify-center">
                        <FileAudio className="w-8 h-8 text-purple-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {uploadedFile.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatFileSize(uploadedFile.size)}</span>
                          <span>{formatTime(uploadedFile.duration || 0)}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-3 bg-purple-primary rounded-xl text-white font-medium hover:bg-purple-secondary transition-colors"
                      >
                        Continue
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </motion.div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Track Details
                  </h2>
                  <p className="text-gray-400">
                    Add information about your track
                  </p>
                </div>

                {/* Cover Art */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Image className="w-5 h-5 mr-2" />
                    Cover Art
                  </h3>

                  <div className="flex items-center space-x-4">
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl bg-purple-dark/50 border-2 border-dashed border-purple-primary/50 flex items-center justify-center cursor-pointer hover:border-purple-primary transition-colors overflow-hidden"
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Upload cover art</p>
                      <p className="text-sm text-gray-400">
                        Recommended: 1000x1000px
                      </p>
                    </div>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                {/* Basic Info */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Music className="w-5 h-5 mr-2" />
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Track Title *
                    </label>
                    <input
                      type="text"
                      value={trackInfo.title}
                      onChange={(e) =>
                        setTrackInfo((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter track title"
                      className="w-full p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Genre
                    </label>
                    <select
                      value={trackInfo.genre}
                      onChange={(e) =>
                        setTrackInfo((prev) => ({
                          ...prev,
                          genre: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white focus:outline-none focus:border-purple-primary"
                    >
                      <option value="">Select genre</option>
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description
                    </label>
                    <textarea
                      value={trackInfo.description}
                      onChange={(e) =>
                        setTrackInfo((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Tell people about your track..."
                      rows={3}
                      className="w-full p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary resize-none"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Tags
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {trackInfo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-primary/20 border border-purple-primary/50 rounded-full text-sm text-white flex items-center space-x-2"
                      >
                        <span>{tag}</span>
                        <button onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      placeholder="Add tags"
                      className="flex-1 p-3 bg-purple-dark/50 border border-purple-primary/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addTag}
                      className="px-4 py-3 bg-purple-primary rounded-xl text-white hover:bg-purple-secondary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {popularTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!trackInfo.tags.includes(tag)) {
                            setTrackInfo((prev) => ({
                              ...prev,
                              tags: [...prev.tags, tag],
                            }));
                          }
                        }}
                        className="px-3 py-1 bg-purple-dark/50 border border-purple-primary/30 rounded-full text-sm text-gray-400 hover:text-white hover:border-purple-primary/50 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Privacy & Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Visibility</p>
                        <p className="text-sm text-gray-400">
                          Who can see this track
                        </p>
                      </div>
                      <select
                        value={trackInfo.visibility}
                        onChange={(e) =>
                          setTrackInfo((prev) => ({
                            ...prev,
                            visibility: e.target.value as any,
                          }))
                        }
                        className="p-2 bg-purple-dark/50 border border-purple-primary/30 rounded-lg text-white focus:outline-none focus:border-purple-primary"
                      >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Explicit Content
                        </p>
                        <p className="text-sm text-gray-400">
                          Contains explicit lyrics
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setTrackInfo((prev) => ({
                            ...prev,
                            isExplicit: !prev.isExplicit,
                          }))
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          trackInfo.isExplicit ? "bg-red-500" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: trackInfo.isExplicit ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full"
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Allow Downloads
                        </p>
                        <p className="text-sm text-gray-400">
                          Let people download this track
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setTrackInfo((prev) => ({
                            ...prev,
                            allowDownloads: !prev.allowDownloads,
                          }))
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          trackInfo.allowDownloads
                            ? "bg-purple-primary"
                            : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: trackInfo.allowDownloads ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full"
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Allow Comments</p>
                        <p className="text-sm text-gray-400">
                          Let people comment on this track
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setTrackInfo((prev) => ({
                            ...prev,
                            allowComments: !prev.allowComments,
                          }))
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          trackInfo.allowComments
                            ? "bg-purple-primary"
                            : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: trackInfo.allowComments ? 24 : 2 }}
                          className="w-5 h-5 bg-white rounded-full"
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3 bg-gray-600 rounded-xl text-white font-medium"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-3 bg-purple-primary rounded-xl text-white font-medium"
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Publish */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Review & Publish
                  </h2>
                  <p className="text-gray-400">
                    Review your track before publishing
                  </p>
                </div>

                {/* Track Preview */}
                <div className="bg-purple-dark/30 rounded-2xl p-6 border border-purple-primary/20 mb-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-purple-primary/20 flex items-center justify-center">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-8 h-8 text-purple-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {trackInfo.title || "Untitled"}
                      </h3>
                      <p className="text-purple-accent mb-2">
                        Your Artist Name
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        {trackInfo.genre && <span>{trackInfo.genre}</span>}
                        <span>{formatTime(duration)}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            trackInfo.visibility === "public"
                              ? "bg-green-500/20 text-green-400"
                              : trackInfo.visibility === "unlisted"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {trackInfo.visibility}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {trackInfo.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {trackInfo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-purple-primary/20 rounded-full text-xs text-purple-accent"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {trackInfo.description && (
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {trackInfo.description}
                    </p>
                  )}

                  {/* Settings Summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Downloads:</span>
                      <span className="text-white">
                        {trackInfo.allowDownloads ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Comments:</span>
                      <span className="text-white">
                        {trackInfo.allowComments ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-3 bg-gray-600 rounded-xl text-white font-medium"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublish}
                    disabled={isUploading}
                    className="flex-1 py-3 bg-purple-primary rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4" />
                        <span>Publish Track</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Footer */}
        <MobileFooter />
      </div>
    </div>
  );
}

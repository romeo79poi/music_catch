import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useEnhancedMusic } from "../context/EnhancedMusicContext";
import { cn } from "../lib/utils";

interface LikeButtonProps {
  songId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  songId,
  className,
  size = "md",
  showLabel = false,
}) => {
  const { toggleLikeSong } = useEnhancedMusic();

  // Simple liked state - can be enhanced with actual user preferences
  const isSongLiked = (songId: string) => false; // TODO: Implement actual like checking
  const [isLoading, setIsLoading] = useState(false);

  const isLiked = isSongLiked(songId);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events

    if (isLoading) return;

    setIsLoading(true);
    try {
      await toggleLikeSong(songId);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 rounded-full transition-all duration-200 hover:scale-110",
        buttonSizeClasses[size],
        isLiked
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-red-500",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
      title={isLiked ? "Unlike this song" : "Like this song"}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          "transition-all duration-200",
          isLiked && "fill-current",
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isLiked ? "Liked" : "Like"}
        </span>
      )}
    </button>
  );
};

export default LikeButton;

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusic } from "./MusicContextSupabase";
import { Laptop2, ListMusic, Mic2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume1 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const PlaybackControls = () => {
	const [currentTime, setCurrentTime] = useState(0);
	const [localVolume, setLocalVolume] = useState(50);
	const [isDragging, setIsDragging] = useState(false);
	const {
		currentSong,
		isPlaying,
		volume,
		progress,
		duration,
		playSong,
		pauseSong,
		resumeSong,
		nextSong,
		previousSong,
		seekTo,
		setVolume
	} = useMusic();

	const progressIntervalRef = useRef<NodeJS.Timeout>();

	// Update progress when not dragging
	useEffect(() => {
		if (!isDragging) {
			setCurrentTime(progress);
		}
	}, [progress, isDragging]);

	// Update volume when it changes from context
	useEffect(() => {
		setLocalVolume(volume * 100);
	}, [volume]);

	const handlePlayPause = () => {
		if (!currentSong) return;
		
		if (isPlaying) {
			pauseSong();
		} else {
			resumeSong();
		}
	};

	const handleProgressChange = (values: number[]) => {
		const newTime = values[0];
		setCurrentTime(newTime);
		setIsDragging(true);
	};

	const handleProgressCommit = (values: number[]) => {
		const newTime = values[0];
		seekTo(newTime);
		setIsDragging(false);
	};

	const handleVolumeChange = (values: number[]) => {
		const newVolume = values[0] / 100;
		setLocalVolume(values[0]);
		setVolume(newVolume);
	};

	if (!currentSong) {
		return null;
	}

	return (
		<div className="flex items-center justify-between p-4 bg-background border-t">
			{/* Song Info */}
			<div className="flex items-center space-x-4 flex-1 min-w-0">
				<div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
					{currentSong.cover_url ? (
						<img 
							src={currentSong.cover_url} 
							alt={currentSong.title}
							className="h-full w-full rounded object-cover"
						/>
					) : (
						<ListMusic className="h-6 w-6" />
					)}
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium truncate">{currentSong.title}</p>
					<p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
				</div>
			</div>

			{/* Main Controls */}
			<div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
				<div className="flex items-center space-x-2">
					<Button variant="ghost" size="sm" onClick={() => {}}>
						<Shuffle className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={previousSong}>
						<SkipBack className="h-4 w-4" />
					</Button>
					<Button onClick={handlePlayPause} size="sm">
						{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
					</Button>
					<Button variant="ghost" size="sm" onClick={nextSong}>
						<SkipForward className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={() => {}}>
						<Repeat className="h-4 w-4" />
					</Button>
				</div>
				
				{/* Progress Bar */}
				<div className="flex items-center space-x-2 w-full">
					<span className="text-xs text-muted-foreground min-w-[40px]">
						{formatTime(currentTime)}
					</span>
					<Slider
						value={[currentTime]}
						max={duration || 100}
						step={1}
						onValueChange={handleProgressChange}
						onValueCommit={handleProgressCommit}
						className="flex-1"
					/>
					<span className="text-xs text-muted-foreground min-w-[40px]">
						{formatTime(duration || 0)}
					</span>
				</div>
			</div>

			{/* Volume & Additional Controls */}
			<div className="flex items-center space-x-2 flex-1 justify-end">
				<Button variant="ghost" size="sm">
					<Mic2 className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm">
					<ListMusic className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm">
					<Laptop2 className="h-4 w-4" />
				</Button>
				<div className="flex items-center space-x-2">
					<Volume1 className="h-4 w-4" />
					<Slider
						value={[localVolume]}
						max={100}
						step={1}
						onValueChange={handleVolumeChange}
						className="w-20"
					/>
				</div>
			</div>
		</div>
	);
};

export default PlaybackControls;

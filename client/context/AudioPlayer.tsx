import { useEffect, useRef } from "react";
import { useMusic } from "./MusicContextSupabase";
import { useFirebase } from "./FirebaseContext";

const AudioPlayer = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevSongRef = useRef<string | null>(null);

	const { currentSong, isPlaying, nextSong } = useMusic();
	const { user: firebaseUser } = useFirebase();

	// Track listening history for Firebase users
	useEffect(() => {
		if (firebaseUser && currentSong && isPlaying) {
			const trackHistory = {
				trackId: currentSong.id,
				trackTitle: currentSong.title,
				artist: currentSong.artist,
				playedAt: new Date().toISOString(),
				firebaseUserId: firebaseUser.uid,
			};

			// Save to localStorage as fallback
			const existingHistory = localStorage.getItem(`firebase_${firebaseUser.uid}_history`) || '[]';
			try {
				const history = JSON.parse(existingHistory);
				history.unshift(trackHistory);
				// Keep only last 100 tracks
				if (history.length > 100) history.splice(100);
				localStorage.setItem(`firebase_${firebaseUser.uid}_history`, JSON.stringify(history));
				console.log('🔥 Saved track to Firebase user history:', currentSong.title);
			} catch (error) {
				console.error('Failed to save track history:', error);
			}
		}
	}, [currentSong, isPlaying, firebaseUser]);

	// handle song ends
	useEffect(() => {
		const audio = audioRef.current;

		const handleEnded = () => {
			nextSong();
		};

		audio?.addEventListener("ended", handleEnded);

		return () => audio?.removeEventListener("ended", handleEnded);
	}, [nextSong]);

	// handle song changes
	useEffect(() => {
		if (!audioRef.current || !currentSong) return;

		const audio = audioRef.current;

		// check if this is actually a new song
		const isSongChange = prevSongRef.current !== currentSong?.url;
		if (isSongChange) {
			audio.src = currentSong?.url || '';
			// reset the playback position
			audio.currentTime = 0;

			prevSongRef.current = currentSong?.url || null;

			if (isPlaying) audio.play();
		}

		// toggle playback based on the isPlaying state
		if (isPlaying && audio.paused) {
			audio.play();
		} else if (!isPlaying && !audio.paused) {
			audio.pause();
		}
	}, [currentSong, isPlaying]);

	return <audio ref={audioRef} style={{ display: "none" }} />;
};

export default AudioPlayer;

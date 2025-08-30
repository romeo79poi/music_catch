// Enhanced Music Player Service with Supabase Integration
// This service manages music playback, integrates with Supabase for song data, and handles audio streaming

import { supabase, supabaseAPI, type Song } from './supabase'
import { musicAPI, ExternalSong } from './music-api'

export interface PlaybackState {
  isPlaying: boolean
  currentSong: Song | null
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
  queue: Song[]
  currentIndex: number
  repeatMode: 'none' | 'one' | 'all'
  shuffleMode: boolean
}

export interface PlaybackHistory {
  song_id: string
  played_at: string
  duration_played: number
  completed: boolean
}

export class MusicPlayerService {
  private audio: HTMLAudioElement | null = null
  private state: PlaybackState = {
    isPlaying: false,
    currentSong: null,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    queue: [],
    currentIndex: -1,
    repeatMode: 'none',
    shuffleMode: false
  }
  private listeners: ((state: PlaybackState) => void)[] = []
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeAudio()
  }

  private initializeAudio() {
    this.audio = new Audio()
    this.audio.crossOrigin = 'anonymous'
    
    // Audio event listeners
    this.audio.addEventListener('loadstart', () => {
      this.state.isLoading = true
      this.notifyListeners()
    })

    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audio?.duration || 0
      this.state.isLoading = false
      this.notifyListeners()
    })

    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio?.currentTime || 0
      this.notifyListeners()
    })

    this.audio.addEventListener('ended', () => {
      this.handleSongEnd()
    })

    this.audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error)
      this.state.isLoading = false
      this.state.isPlaying = false
      this.notifyListeners()
    })

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true
      this.startProgressTracking()
      this.notifyListeners()
    })

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false
      this.stopProgressTracking()
      this.notifyListeners()
    })

    // Set initial volume
    this.audio.volume = this.state.volume
  }

  // Playback Control Methods
  async playSong(song: Song, startTime = 0) {
    try {
      this.state.isLoading = true
      this.state.currentSong = song
      this.notifyListeners()

      // Get audio URL - either from Supabase storage or external source
      let audioUrl = song.url

      if (!audioUrl && song.id) {
        // Try to get audio from Supabase storage - construct URL directly
        audioUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/songs/${song.id}.mp3`
      }

      if (!audioUrl) {
        // Fallback: try to get preview from external API
        const externalSongs = await musicAPI.searchSongs(`${song.title} ${song.artist}`, 1)
        if (externalSongs.length > 0 && externalSongs[0].preview_url) {
          audioUrl = externalSongs[0].preview_url
        }
      }

      if (!audioUrl) {
        throw new Error('No audio source available for this song')
      }

      if (this.audio) {
        this.audio.src = audioUrl
        this.audio.currentTime = startTime
        await this.audio.play()

        // Track playback in Supabase
        await this.trackPlayback(song.id)
      }
    } catch (error) {
      console.error('Error playing song:', error)
      this.state.isLoading = false
      this.state.isPlaying = false
      this.notifyListeners()
      throw error
    }
  }

  async pause() {
    if (this.audio && this.state.isPlaying) {
      this.audio.pause()
    }
  }

  async resume() {
    if (this.audio && !this.state.isPlaying) {
      try {
        await this.audio.play()
      } catch (error) {
        console.error('Error resuming playback:', error)
      }
    }
  }

  async stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.state.currentSong = null
      this.state.isPlaying = false
      this.notifyListeners()
    }
  }

  async seekTo(time: number) {
    if (this.audio && this.state.duration > 0) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.state.duration))
    }
  }

  async setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.state.volume = clampedVolume
    
    if (this.audio) {
      this.audio.volume = clampedVolume
    }
    
    this.notifyListeners()
  }

  // Queue Management
  setQueue(songs: Song[], startIndex = 0) {
    this.state.queue = songs
    this.state.currentIndex = startIndex
    this.notifyListeners()
  }

  addToQueue(song: Song) {
    this.state.queue.push(song)
    this.notifyListeners()
  }

  removeFromQueue(index: number) {
    if (index >= 0 && index < this.state.queue.length) {
      this.state.queue.splice(index, 1)
      
      // Adjust current index if necessary
      if (index < this.state.currentIndex) {
        this.state.currentIndex--
      } else if (index === this.state.currentIndex) {
        // Current song was removed, stop playback
        this.stop()
        this.state.currentIndex = -1
      }
      
      this.notifyListeners()
    }
  }

  async playNext() {
    if (this.state.queue.length === 0) return

    let nextIndex = this.state.currentIndex + 1

    if (this.state.shuffleMode) {
      // Random next song (excluding current)
      const availableIndices = this.state.queue
        .map((_, i) => i)
        .filter(i => i !== this.state.currentIndex)
      
      if (availableIndices.length > 0) {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
      }
    }

    if (nextIndex >= this.state.queue.length) {
      if (this.state.repeatMode === 'all') {
        nextIndex = 0
      } else {
        return // End of queue
      }
    }

    this.state.currentIndex = nextIndex
    await this.playSong(this.state.queue[nextIndex])
  }

  async playPrevious() {
    if (this.state.queue.length === 0) return

    // If more than 3 seconds played, restart current song
    if (this.state.currentTime > 3) {
      await this.seekTo(0)
      return
    }

    let prevIndex = this.state.currentIndex - 1

    if (prevIndex < 0) {
      if (this.state.repeatMode === 'all') {
        prevIndex = this.state.queue.length - 1
      } else {
        return // Beginning of queue
      }
    }

    this.state.currentIndex = prevIndex
    await this.playSong(this.state.queue[prevIndex])
  }

  // Playback Modes
  toggleRepeat() {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(this.state.repeatMode)
    this.state.repeatMode = modes[(currentIndex + 1) % modes.length]
    this.notifyListeners()
  }

  toggleShuffle() {
    this.state.shuffleMode = !this.state.shuffleMode
    this.notifyListeners()
  }

  // Event Handling
  private async handleSongEnd() {
    if (this.state.currentSong) {
      // Track completion
      await this.trackCompletion(this.state.currentSong.id)
    }

    if (this.state.repeatMode === 'one') {
      // Repeat current song
      await this.seekTo(0)
      await this.resume()
    } else {
      // Play next song
      await this.playNext()
    }
  }

  private startProgressTracking() {
    this.stopProgressTracking()
    this.updateInterval = setInterval(() => {
      if (this.audio && this.state.isPlaying) {
        this.state.currentTime = this.audio.currentTime
        this.notifyListeners()
      }
    }, 1000)
  }

  private stopProgressTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  // Analytics and Tracking
  private async trackPlayback(songId: string) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) {
        // Track in listening history
        await supabase
          .from('listening_history')
          .insert([{
            user_id: data.session.user.id,
            song_id: songId,
            played_at: new Date().toISOString(),
            duration_played: 0,
            completed: false
          }])
      }
    } catch (error) {
      console.warn('Failed to track playback:', error)
    }
  }

  private async trackCompletion(songId: string) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) {
        // Update listening history with completion
        await supabase
          .from('listening_history')
          .update({
            duration_played: this.state.currentTime,
            completed: this.state.currentTime >= (this.state.duration * 0.8) // 80% completion threshold
          })
          .eq('user_id', data.session.user.id)
          .eq('song_id', songId)
          .eq('played_at', new Date().toISOString().split('T')[0]) // Today's plays
      }
    } catch (error) {
      console.warn('Failed to track completion:', error)
    }
  }

  // State Management
  getState(): PlaybackState {
    return { ...this.state }
  }

  subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  // Cleanup
  destroy() {
    this.stopProgressTracking()
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.listeners = []
  }

  // Playlist Integration
  async loadPlaylist(playlistId: string, startIndex = 0) {
    try {
      const { data: playlistSongs, error } = await supabaseAPI.getPlaylistSongs(playlistId)
      
      if (error) {
        throw new Error('Failed to load playlist')
      }

      const songs = playlistSongs?.map((ps: any) => ps.songs).filter(Boolean) || []
      this.setQueue(songs, startIndex)

      if (songs.length > 0) {
        await this.playSong(songs[startIndex])
      }
    } catch (error) {
      console.error('Error loading playlist:', error)
      throw error
    }
  }

  async loadUserLikes() {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data?.session?.user) {
        throw new Error('User not authenticated')
      }

      const { data: userLikes, error } = await supabaseAPI.getUserLikedSongs(data.session.user.id)
      
      if (error) {
        throw new Error('Failed to load liked songs')
      }

      const songs = userLikes?.map((like: any) => like.songs).filter(Boolean) || []
      this.setQueue(songs, 0)

      if (songs.length > 0) {
        await this.playSong(songs[0])
      }
    } catch (error) {
      console.error('Error loading liked songs:', error)
      throw error
    }
  }

  // Lyrics Integration (placeholder for future implementation)
  async getLyrics(songTitle: string, artist: string): Promise<string | null> {
    try {
      // This would integrate with a lyrics API like Genius, Musixmatch, etc.
      // For demo purposes, return a placeholder
      return `[Verse 1]\nThis is where the lyrics for "${songTitle}" by ${artist} would appear.\n\n[Chorus]\nLyrics would be fetched from a public API\nLike Genius or Musixmatch\n\n[Verse 2]\nReal implementation would require\nAPI integration and error handling`
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      return null
    }
  }
}

// Export singleton instance
export const musicPlayer = new MusicPlayerService()

// Service interface for React components
export const getMusicPlayerInterface = () => ({
  state: musicPlayer.getState(),
  playSong: musicPlayer.playSong.bind(musicPlayer),
  pause: musicPlayer.pause.bind(musicPlayer),
  resume: musicPlayer.resume.bind(musicPlayer),
  stop: musicPlayer.stop.bind(musicPlayer),
  seekTo: musicPlayer.seekTo.bind(musicPlayer),
  setVolume: musicPlayer.setVolume.bind(musicPlayer),
  playNext: musicPlayer.playNext.bind(musicPlayer),
  playPrevious: musicPlayer.playPrevious.bind(musicPlayer),
  toggleRepeat: musicPlayer.toggleRepeat.bind(musicPlayer),
  toggleShuffle: musicPlayer.toggleShuffle.bind(musicPlayer),
  setQueue: musicPlayer.setQueue.bind(musicPlayer),
  addToQueue: musicPlayer.addToQueue.bind(musicPlayer),
  removeFromQueue: musicPlayer.removeFromQueue.bind(musicPlayer),
  loadPlaylist: musicPlayer.loadPlaylist.bind(musicPlayer),
  loadUserLikes: musicPlayer.loadUserLikes.bind(musicPlayer),
  getLyrics: musicPlayer.getLyrics.bind(musicPlayer),
  subscribe: musicPlayer.subscribe.bind(musicPlayer)
})

// Utility functions for integration
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const calculateProgress = (currentTime: number, duration: number): number => {
  if (duration === 0) return 0
  return Math.max(0, Math.min(100, (currentTime / duration) * 100))
}

// Real-time Service for Catch Music App
// This service handles real-time features like live playlist updates, user activity, and collaborative features

import { supabase, isSupabaseAvailable } from './supabase'
import { ErrorHandler } from './error-handler'

const errorHandler = ErrorHandler.getInstance()

export interface RealTimeEvent {
  type: 'playlist_updated' | 'song_added' | 'song_removed' | 'user_activity' | 'like_added' | 'like_removed'
  payload: any
  timestamp: string
  userId?: string
}

export interface UserActivity {
  userId: string
  username: string
  action: 'playing' | 'paused' | 'added_to_playlist' | 'liked_song' | 'created_playlist'
  details: {
    songId?: string
    songTitle?: string
    artistName?: string
    playlistId?: string
    playlistName?: string
  }
  timestamp: string
}

export interface PlaylistUpdate {
  playlistId: string
  playlistName: string
  action: 'song_added' | 'song_removed' | 'playlist_updated'
  songId?: string
  songTitle?: string
  userId: string
  username: string
  timestamp: string
}

export class RealTimeService {
  private subscriptions = new Map<string, any>()
  private eventListeners = new Map<string, ((event: RealTimeEvent) => void)[]>()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const available = await isSupabaseAvailable()
      if (available) {
        this.isConnected = true
        console.log('✅ Real-time service initialized with Supabase')
      } else {
        console.log('⚠️ Real-time service running in demo mode')
        this.simulateDemoEvents()
      }
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.initialize')
      this.simulateDemoEvents()
    }
  }

  // Subscribe to playlist changes
  subscribeToPlaylist(playlistId: string, callback: (update: PlaylistUpdate) => void): () => void {
    if (!this.isConnected) {
      return () => {} // Return empty unsubscribe function for demo mode
    }

    try {
      const channelName = `playlist_${playlistId}`
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'playlist_songs',
          filter: `playlist_id=eq.${playlistId}`
        }, (payload) => {
          this.handlePlaylistChange(playlistId, payload, callback)
        })
        .subscribe()

      this.subscriptions.set(channelName, channel)

      return () => {
        channel.unsubscribe()
        this.subscriptions.delete(channelName)
      }
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.subscribeToPlaylist')
      return () => {}
    }
  }

  // Subscribe to user activity (likes, playlist creation, etc.)
  subscribeToUserActivity(userId: string, callback: (activity: UserActivity) => void): () => void {
    if (!this.isConnected) {
      return () => {}
    }

    try {
      const channelName = `user_activity_${userId}`
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_likes',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleUserLikeActivity(payload, callback)
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'playlists',
          filter: `created_by=eq.${userId}`
        }, (payload) => {
          this.handleUserPlaylistActivity(payload, callback)
        })
        .subscribe()

      this.subscriptions.set(channelName, channel)

      return () => {
        channel.unsubscribe()
        this.subscriptions.delete(channelName)
      }
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.subscribeToUserActivity')
      return () => {}
    }
  }

  // Subscribe to global activity feed
  subscribeToGlobalActivity(callback: (activity: UserActivity) => void): () => void {
    if (!this.isConnected) {
      // In demo mode, simulate some global activity
      const interval = setInterval(() => {
        const demoActivity: UserActivity = {
          userId: 'demo-user',
          username: 'Demo User',
          action: ['playing', 'liked_song', 'created_playlist'][Math.floor(Math.random() * 3)] as any,
          details: {
            songTitle: 'Demo Song',
            artistName: 'Demo Artist'
          },
          timestamp: new Date().toISOString()
        }
        callback(demoActivity)
      }, 10000) // Every 10 seconds

      return () => clearInterval(interval)
    }

    try {
      const channelName = 'global_activity'
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_likes'
        }, (payload) => {
          this.handleGlobalLikeActivity(payload, callback)
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'playlists'
        }, (payload) => {
          this.handleGlobalPlaylistActivity(payload, callback)
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'listening_history'
        }, (payload) => {
          this.handleGlobalListeningActivity(payload, callback)
        })
        .subscribe()

      this.subscriptions.set(channelName, channel)

      return () => {
        channel.unsubscribe()
        this.subscriptions.delete(channelName)
      }
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.subscribeToGlobalActivity')
      return () => {}
    }
  }

  // Send real-time event (for broadcasting user actions)
  async broadcastEvent(event: RealTimeEvent): Promise<void> {
    if (!this.isConnected) {
      console.log('📡 Demo mode: Broadcasting event', event)
      return
    }

    try {
      const channel = supabase.channel('broadcast')
      await channel.send({
        type: 'broadcast',
        event: event.type,
        payload: event
      })
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.broadcastEvent')
    }
  }

  // Presence feature - show who's online
  async joinPresence(userId: string, userInfo: { username: string, currentSong?: string }): Promise<() => void> {
    if (!this.isConnected) {
      return () => {}
    }

    try {
      const channel = supabase.channel('online_users')
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            username: userInfo.username,
            current_song: userInfo.currentSong,
            online_at: new Date().toISOString()
          })
        }
      })

      return () => {
        channel.untrack()
        channel.unsubscribe()
      }
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.joinPresence')
      return () => {}
    }
  }

  // Get currently online users
  async getOnlineUsers(): Promise<Array<{ userId: string, username: string, currentSong?: string }>> {
    if (!this.isConnected) {
      return [
        { userId: 'demo-1', username: 'Demo User 1', currentSong: 'Purple Rain' },
        { userId: 'demo-2', username: 'Demo User 2', currentSong: 'Midnight Glow' }
      ]
    }

    try {
      const channel = supabase.channel('online_users')
      const presenceState = channel.presenceState()
      
      return Object.values(presenceState).flat().map((presence: any) => ({
        userId: presence.user_id,
        username: presence.username,
        currentSong: presence.current_song
      }))
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.getOnlineUsers')
      return []
    }
  }

  // Handle playlist changes
  private async handlePlaylistChange(
    playlistId: string,
    payload: any,
    callback: (update: PlaylistUpdate) => void
  ) {
    try {
      const update: PlaylistUpdate = {
        playlistId,
        playlistName: 'Playlist', // Would fetch from database
        action: payload.eventType === 'INSERT' ? 'song_added' : 'song_removed',
        songId: payload.new?.song_id || payload.old?.song_id,
        userId: payload.new?.added_by || payload.old?.added_by,
        username: 'User', // Would fetch from database
        timestamp: new Date().toISOString()
      }

      callback(update)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handlePlaylistChange')
    }
  }

  // Handle user like activity
  private async handleUserLikeActivity(
    payload: any,
    callback: (activity: UserActivity) => void
  ) {
    try {
      const activity: UserActivity = {
        userId: payload.new?.user_id || payload.old?.user_id,
        username: 'User', // Would fetch from database
        action: payload.eventType === 'INSERT' ? 'liked_song' : 'liked_song',
        details: {
          songId: payload.new?.song_id || payload.old?.song_id
        },
        timestamp: new Date().toISOString()
      }

      callback(activity)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handleUserLikeActivity')
    }
  }

  // Handle user playlist activity
  private async handleUserPlaylistActivity(
    payload: any,
    callback: (activity: UserActivity) => void
  ) {
    try {
      const activity: UserActivity = {
        userId: payload.new.created_by,
        username: 'User', // Would fetch from database
        action: 'created_playlist',
        details: {
          playlistId: payload.new.id,
          playlistName: payload.new.name
        },
        timestamp: new Date().toISOString()
      }

      callback(activity)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handleUserPlaylistActivity')
    }
  }

  // Handle global like activity
  private async handleGlobalLikeActivity(
    payload: any,
    callback: (activity: UserActivity) => void
  ) {
    try {
      const activity: UserActivity = {
        userId: payload.new.user_id,
        username: 'Someone', // Would fetch from database
        action: 'liked_song',
        details: {
          songId: payload.new.song_id
        },
        timestamp: new Date().toISOString()
      }

      callback(activity)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handleGlobalLikeActivity')
    }
  }

  // Handle global playlist activity
  private async handleGlobalPlaylistActivity(
    payload: any,
    callback: (activity: UserActivity) => void
  ) {
    try {
      const activity: UserActivity = {
        userId: payload.new.created_by,
        username: 'Someone', // Would fetch from database
        action: 'created_playlist',
        details: {
          playlistId: payload.new.id,
          playlistName: payload.new.name
        },
        timestamp: new Date().toISOString()
      }

      callback(activity)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handleGlobalPlaylistActivity')
    }
  }

  // Handle global listening activity
  private async handleGlobalListeningActivity(
    payload: any,
    callback: (activity: UserActivity) => void
  ) {
    try {
      const activity: UserActivity = {
        userId: payload.new.user_id,
        username: 'Someone', // Would fetch from database
        action: 'playing',
        details: {
          songId: payload.new.song_id
        },
        timestamp: new Date().toISOString()
      }

      callback(activity)
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.handleGlobalListeningActivity')
    }
  }

  // Demo mode simulation
  private simulateDemoEvents() {
    console.log('🎮 Running real-time service in demo mode')
    
    // Simulate some activity every 30 seconds
    setInterval(() => {
      const demoEvents = [
        { type: 'song_added', payload: { songTitle: 'Demo Song', playlistName: 'Demo Playlist' } },
        { type: 'user_activity', payload: { action: 'liked_song', songTitle: 'Another Demo Song' } },
        { type: 'playlist_updated', payload: { playlistName: 'Updated Playlist' } }
      ]
      
      const randomEvent = demoEvents[Math.floor(Math.random() * demoEvents.length)]
      console.log('📡 Demo real-time event:', randomEvent)
    }, 30000)
  }

  // Connection management
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay))
      await this.initialize()
      this.reconnectAttempts = 0
    } catch (error) {
      errorHandler.handleError(error, 'RealTimeService.reconnect')
      this.reconnectDelay *= 2 // Exponential backoff
      await this.reconnect()
    }
  }

  // Cleanup
  disconnect(): void {
    for (const [channelName, subscription] of this.subscriptions) {
      subscription.unsubscribe()
    }
    this.subscriptions.clear()
    this.eventListeners.clear()
    this.isConnected = false
    console.log('🔌 Real-time service disconnected')
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean, subscriptions: number } {
    return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size
    }
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService()

// Utility functions for React components
export const useRealTimePlaylist = (playlistId: string) => {
  // This would be implemented in components that use React hooks
  return {
    subscribe: (callback: (update: PlaylistUpdate) => void) => 
      realTimeService.subscribeToPlaylist(playlistId, callback),
    broadcast: (event: RealTimeEvent) => 
      realTimeService.broadcastEvent(event)
  }
}

export const useRealTimeActivity = () => {
  return {
    subscribeToGlobal: (callback: (activity: UserActivity) => void) =>
      realTimeService.subscribeToGlobalActivity(callback),
    subscribeToUser: (userId: string, callback: (activity: UserActivity) => void) =>
      realTimeService.subscribeToUserActivity(userId, callback),
    getOnlineUsers: () => realTimeService.getOnlineUsers()
  }
}

export const usePresence = (userId: string, userInfo: { username: string, currentSong?: string }) => {
  return {
    join: () => realTimeService.joinPresence(userId, userInfo),
    getOnlineUsers: () => realTimeService.getOnlineUsers()
  }
}

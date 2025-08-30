import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ListeningSession {
  id: string;
  user_id: string;
  song_id: string;
  started_at: string;
  current_position: number;
  is_playing: boolean;
}

interface MusicRoomActivity {
  id: string;
  user_id: string;
  activity_type: 'listening' | 'liked' | 'shared' | 'created_playlist';
  song_id?: string;
  playlist_id?: string;
  created_at: string;
  user?: {
    username: string;
    name: string;
    avatar_url?: string;
  };
}

interface RealTimeMusicManager {
  // Current user's listening session
  startListeningSession: (userId: string, songId: string) => Promise<void>;
  updateListeningPosition: (sessionId: string, position: number) => Promise<void>;
  pauseListening: (sessionId: string) => Promise<void>;
  resumeListening: (sessionId: string) => Promise<void>;
  endListeningSession: (sessionId: string) => Promise<void>;

  // Friend activity tracking
  subscribeToFriendsActivity: (userId: string, callback: (activity: MusicRoomActivity[]) => void) => RealtimeChannel;
  publishActivity: (userId: string, activityType: string, data: any) => Promise<void>;

  // Live listening rooms
  createListeningRoom: (userId: string, songId: string, isPublic: boolean) => Promise<string>;
  joinListeningRoom: (roomId: string, userId: string) => Promise<void>;
  leaveListeningRoom: (roomId: string, userId: string) => Promise<void>;
  subscribeToRoom: (roomId: string, callback: (participants: any[]) => void) => RealtimeChannel;

  // Real-time charts and trends
  subscribeToTrendingUpdates: (callback: (trends: any[]) => void) => RealtimeChannel;
  subscribeToNewReleases: (callback: (releases: any[]) => void) => RealtimeChannel;
}

class RealTimeMusicService implements RealTimeMusicManager {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private currentSession: string | null = null;

  async startListeningSession(userId: string, songId: string): Promise<void> {
    try {
      // End any existing session first
      if (this.currentSession) {
        await this.endListeningSession(this.currentSession);
      }

      const { data, error } = await supabase
        .from('listening_sessions')
        .insert([{
          user_id: userId,
          song_id: songId,
          started_at: new Date().toISOString(),
          current_position: 0,
          is_playing: true
        }])
        .select()
        .single();

      if (error) throw error;

      this.currentSession = data.id;

      // Also record in listening history
      await supabase
        .from('user_listening_history')
        .insert([{
          user_id: userId,
          song_id: songId,
          played_at: new Date().toISOString()
        }]);

      // Update song play count
      await supabase
        .from('songs')
        .update({ 
          play_count: 1, // Simple increment - actual SQL would be handled server-side
          last_played: new Date().toISOString()
        })
        .eq('id', songId);

      // Publish activity to friends
      await this.publishActivity(userId, 'listening', { song_id: songId });

    } catch (error) {
      console.error('Failed to start listening session:', error);
    }
  }

  async updateListeningPosition(sessionId: string, position: number): Promise<void> {
    try {
      await supabase
        .from('listening_sessions')
        .update({ 
          current_position: position,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update listening position:', error);
    }
  }

  async pauseListening(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('listening_sessions')
        .update({ 
          is_playing: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to pause listening:', error);
    }
  }

  async resumeListening(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('listening_sessions')
        .update({ 
          is_playing: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to resume listening:', error);
    }
  }

  async endListeningSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('listening_sessions')
        .update({ 
          ended_at: new Date().toISOString(),
          is_playing: false
        })
        .eq('id', sessionId);

      if (this.currentSession === sessionId) {
        this.currentSession = null;
      }
    } catch (error) {
      console.error('Failed to end listening session:', error);
    }
  }

  subscribeToFriendsActivity(userId: string, callback: (activity: MusicRoomActivity[]) => void): RealtimeChannel {
    const channelId = `friends-activity-${userId}`;
    
    // Clean up existing channel
    if (this.activeChannels.has(channelId)) {
      this.activeChannels.get(channelId)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activity',
        filter: `user_id=in.(${userId})` // This would need to be expanded to include friends
      }, (payload) => {
        // Fetch the latest activity with user details
        this.fetchFriendsActivity(userId).then(callback);
      })
      .subscribe();

    this.activeChannels.set(channelId, channel);
    
    // Initial load
    this.fetchFriendsActivity(userId).then(callback);

    return channel;
  }

  private async fetchFriendsActivity(userId: string): Promise<MusicRoomActivity[]> {
    try {
      // This would typically join with a friends table
      const { data, error } = await supabase
        .from('user_activity')
        .select(`
          *,
          users:user_id (username, name, avatar_url),
          songs:song_id (title, artist),
          playlists:playlist_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch friends activity:', error);
      return [];
    }
  }

  async publishActivity(userId: string, activityType: string, data: any): Promise<void> {
    try {
      await supabase
        .from('user_activity')
        .insert([{
          user_id: userId,
          activity_type: activityType,
          song_id: data.song_id,
          playlist_id: data.playlist_id,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Failed to publish activity:', error);
    }
  }

  async createListeningRoom(userId: string, songId: string, isPublic: boolean): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('listening_rooms')
        .insert([{
          host_user_id: userId,
          current_song_id: songId,
          is_public: isPublic,
          created_at: new Date().toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Add host as participant
      await supabase
        .from('room_participants')
        .insert([{
          room_id: data.id,
          user_id: userId,
          joined_at: new Date().toISOString()
        }]);

      return data.id;
    } catch (error) {
      console.error('Failed to create listening room:', error);
      throw error;
    }
  }

  async joinListeningRoom(roomId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('room_participants')
        .insert([{
          room_id: roomId,
          user_id: userId,
          joined_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Failed to join listening room:', error);
    }
  }

  async leaveListeningRoom(roomId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .is('left_at', null);
    } catch (error) {
      console.error('Failed to leave listening room:', error);
    }
  }

  subscribeToRoom(roomId: string, callback: (participants: any[]) => void): RealtimeChannel {
    const channelId = `room-${roomId}`;
    
    // Clean up existing channel
    if (this.activeChannels.has(channelId)) {
      this.activeChannels.get(channelId)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      }, () => {
        this.fetchRoomParticipants(roomId).then(callback);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'listening_rooms',
        filter: `id=eq.${roomId}`
      }, () => {
        this.fetchRoomParticipants(roomId).then(callback);
      })
      .subscribe();

    this.activeChannels.set(channelId, channel);
    
    // Initial load
    this.fetchRoomParticipants(roomId).then(callback);

    return channel;
  }

  private async fetchRoomParticipants(roomId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          *,
          users:user_id (username, name, avatar_url)
        `)
        .eq('room_id', roomId)
        .is('left_at', null);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch room participants:', error);
      return [];
    }
  }

  subscribeToTrendingUpdates(callback: (trends: any[]) => void): RealtimeChannel {
    const channelId = 'trending-updates';
    
    // Clean up existing channel
    if (this.activeChannels.has(channelId)) {
      this.activeChannels.get(channelId)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'songs'
      }, () => {
        this.fetchTrendingSongs().then(callback);
      })
      .subscribe();

    this.activeChannels.set(channelId, channel);
    
    return channel;
  }

  private async fetchTrendingSongs(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('play_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch trending songs:', error);
      return [];
    }
  }

  subscribeToNewReleases(callback: (releases: any[]) => void): RealtimeChannel {
    const channelId = 'new-releases';
    
    // Clean up existing channel
    if (this.activeChannels.has(channelId)) {
      this.activeChannels.get(channelId)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'songs'
      }, () => {
        this.fetchNewReleases().then(callback);
      })
      .subscribe();

    this.activeChannels.set(channelId, channel);
    
    // Initial load
    this.fetchNewReleases().then(callback);

    return channel;
  }

  private async fetchNewReleases(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch new releases:', error);
      return [];
    }
  }

  // Cleanup method
  cleanup(): void {
    this.activeChannels.forEach(channel => {
      channel.unsubscribe();
    });
    this.activeChannels.clear();
  }
}

// Export singleton instance
export const realTimeMusicService = new RealTimeMusicService();

// Export types for use in components
export type { MusicRoomActivity, ListeningSession };

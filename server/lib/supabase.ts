import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

// Create Supabase client with service role key for server operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Server-side operations that bypass RLS
export const serverSupabase = {
  // User operations
  async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    return { data, error }
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    return { data, error }
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    return { data, error }
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Song operations
  async getSongs(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    return { data, error }
  },

  async searchSongs(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .limit(limit)
    
    return { data, error }
  },

  // Album operations
  async getAlbums(limit = 10) {
    const { data, error } = await supabase
      .from('albums')
      .select(`
        *,
        songs:songs(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Playlist operations
  async getUserPlaylists(userId: string) {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs:playlist_songs(count)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getPublicPlaylists(limit = 10) {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs:playlist_songs(count),
        users:created_by(username, name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Check availability
  async checkEmailAvailability(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    return { available: !data, error: error?.code !== 'PGRST116' ? error : null }
  },

  async checkUsernameAvailability(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    
    return { available: !data, error: error?.code !== 'PGRST116' ? error : null }
  }
}

export default supabase

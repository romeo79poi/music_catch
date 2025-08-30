// Music API integration for fetching song data from public APIs
// This service integrates with multiple music APIs to fetch song metadata, album covers, and artist information

// Types for external API responses
export interface ExternalSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  cover_image_url?: string
  preview_url?: string
  external_urls?: {
    streaming?: string
    youtube?: string
    music?: string
  }
}

export interface ExternalArtist {
  id: string
  name: string
  image_url?: string
  followers?: number
  genres?: string[]
}

export interface ExternalAlbum {
  id: string
  name: string
  artist: string
  release_date?: string
  cover_image_url?: string
  total_tracks?: number
}

// Last.fm API integration (free, no authentication required for basic search)
class LastFmAPI {
  private apiKey = 'demo-key' // You would replace this with actual Last.fm API key
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/'

  async searchTracks(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?method=track.search&track=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=${limit}`
      )
      
      if (!response.ok) {
        throw new Error('Last.fm API request failed')
      }
      
      const data = await response.json()
      const tracks = data.results?.trackmatches?.track || []
      
      return tracks.map((track: any) => ({
        id: `lastfm-${track.mbid || track.name}-${track.artist}`,
        title: track.name,
        artist: track.artist,
        cover_image_url: track.image?.[2]?.['#text'] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        external_urls: {
          streaming: track.url
        }
      }))
    } catch (error) {
      console.warn('Last.fm API error:', error)
      return this.getFallbackTracks(query)
    }
  }

  async getArtistInfo(artistName: string): Promise<ExternalArtist | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${this.apiKey}&format=json`
      )
      
      if (!response.ok) {
        throw new Error('Last.fm API request failed')
      }
      
      const data = await response.json()
      const artist = data.artist
      
      if (!artist) return null
      
      return {
        id: `lastfm-${artist.mbid || artist.name}`,
        name: artist.name,
        image_url: artist.image?.[3]?.['#text'],
        followers: parseInt(artist.stats?.listeners || '0'),
        genres: artist.tags?.tag?.map((tag: any) => tag.name) || []
      }
    } catch (error) {
      console.warn('Last.fm artist info error:', error)
      return null
    }
  }

  private getFallbackTracks(query: string): ExternalSong[] {
    // Generate demo tracks based on search query
    const sampleArtists = ['Adele', 'Ed Sheeran', 'Taylor Swift', 'The Beatles', 'Queen', 'Coldplay', 'Imagine Dragons', 'Billie Eilish']
    const sampleTitles = ['Perfect Symphony', 'Midnight Dreams', 'Electric Nights', 'Golden Hour', 'Starlight', 'Ocean Waves', 'City Lights', 'Purple Rain']
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `demo-${i}-${Date.now()}`,
      title: sampleTitles[i % sampleTitles.length] + (query ? ` (${query})` : ''),
      artist: sampleArtists[i % sampleArtists.length],
      album: `Album ${i + 1}`,
      duration: 180 + Math.floor(Math.random() * 120), // 3-5 minutes
      cover_image_url: `https://images.unsplash.com/photo-149322545712${i + 4}-a3eb161ffa5f?w=300&h=300&fit=crop`,
      preview_url: undefined, // No preview for demo tracks
      external_urls: {}
    }))
  }
}

// MusicBrainz API integration (free, open source music database)
class MusicBrainzAPI {
  private baseUrl = 'https://musicbrainz.org/ws/2/'
  private coverArtUrl = 'https://coverartarchive.org/'

  async searchRecordings(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}recording/?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`,
        {
          headers: {
            'User-Agent': 'CatchMusicApp/1.0 (contact@musiccatch.com)'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('MusicBrainz API request failed')
      }
      
      const data = await response.json()
      const recordings = data.recordings || []
      
      return recordings.map((recording: any) => ({
        id: `musicbrainz-${recording.id}`,
        title: recording.title,
        artist: recording['artist-credit']?.[0]?.name || 'Unknown Artist',
        album: recording.releases?.[0]?.title,
        duration: Math.floor(recording.length / 1000) || undefined,
        cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        external_urls: {}
      }))
    } catch (error) {
      console.warn('MusicBrainz API error:', error)
      return []
    }
  }

  async getCoverArt(mbid: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.coverArtUrl}release/${mbid}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.images?.[0]?.thumbnails?.large || data.images?.[0]?.image || null
    } catch (error) {
      console.warn('Cover art fetch error:', error)
      return null
    }
  }
}

// Main Music API service that aggregates multiple sources
export class MusicAPIService {
  private lastFm = new LastFmAPI()
  private musicBrainz = new MusicBrainzAPI()

  async searchSongs(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      // Try multiple APIs and combine results
      const [lastFmResults, musicBrainzResults] = await Promise.allSettled([
        this.lastFm.searchTracks(query, Math.ceil(limit / 2)),
        this.musicBrainz.searchRecordings(query, Math.ceil(limit / 2))
      ])

      const songs: ExternalSong[] = []
      
      if (lastFmResults.status === 'fulfilled') {
        songs.push(...lastFmResults.value)
      }
      
      if (musicBrainzResults.status === 'fulfilled') {
        songs.push(...musicBrainzResults.value)
      }

      // Deduplicate based on title and artist
      const uniqueSongs = songs.filter((song, index, self) => 
        index === self.findIndex(s => 
          s.title.toLowerCase() === song.title.toLowerCase() && 
          s.artist.toLowerCase() === song.artist.toLowerCase()
        )
      )

      return uniqueSongs.slice(0, limit)
    } catch (error) {
      console.error('Music API search error:', error)
      return this.getFallbackSongs(query, limit)
    }
  }

  async getArtistInfo(artistName: string): Promise<ExternalArtist | null> {
    try {
      return await this.lastFm.getArtistInfo(artistName)
    } catch (error) {
      console.error('Artist info fetch error:', error)
      return null
    }
  }

  async getPopularTracks(limit = 20): Promise<ExternalSong[]> {
    // Get popular tracks from multiple genres
    const genres = ['pop', 'rock', 'hip hop', 'electronic', 'jazz', 'classical']
    const results = await Promise.allSettled(
      genres.map(genre => this.searchSongs(genre, Math.ceil(limit / genres.length)))
    )

    const songs: ExternalSong[] = []
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        songs.push(...result.value)
      }
    })

    return songs.slice(0, limit)
  }

  async getTrendingTracks(limit = 20): Promise<ExternalSong[]> {
    // For demo purposes, return popular tracks with trending indicators
    const popular = await this.getPopularTracks(limit)
    return popular.map(song => ({
      ...song,
      id: `trending-${song.id}`,
      title: `🔥 ${song.title}`
    }))
  }

  private getFallbackSongs(query: string, limit: number): ExternalSong[] {
    const sampleSongs = [
      { title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)' },
      { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours' },
      { title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line' },
      { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' },
      { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia' },
      { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', album: 'F*CK LOVE 3+' },
      { title: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', album: 'MONTERO' },
      { title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland' },
      { title: 'As It Was', artist: 'Harry Styles', album: "Harry's House" },
      { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights' }
    ]

    return sampleSongs.slice(0, limit).map((song, index) => ({
      id: `fallback-${index}-${Date.now()}`,
      title: query ? `${song.title} (${query})` : song.title,
      artist: song.artist,
      album: song.album,
      duration: 180 + Math.floor(Math.random() * 120),
      cover_image_url: `https://images.unsplash.com/photo-149322545712${index + 4}-a3eb161ffa5f?w=300&h=300&fit=crop`,
      external_urls: {}
    }))
  }
}

// Export singleton instance
export const musicAPI = new MusicAPIService()

// Utility functions for integration with Supabase
export const integrateExternalSong = async (externalSong: ExternalSong) => {
  // Convert external song format to internal Supabase format
  return {
    title: externalSong.title,
    artist: externalSong.artist,
    cover_image_url: externalSong.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    audio_url: externalSong.preview_url || undefined,
    duration: externalSong.duration,
    created_at: new Date().toISOString()
  }
}

export const enrichSongWithExternalData = async (song: any, externalData: ExternalSong) => {
  return {
    ...song,
    external_id: externalData.id,
    external_urls: externalData.external_urls,
    preview_url: externalData.preview_url
  }
}

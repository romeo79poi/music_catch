// Music API Integration Service
// This service connects the external music APIs with our Supabase backend and existing UI components

import { musicAPI, ExternalSong, integrateExternalSong } from './music-api'
import { supabaseAPI, type Song, type Album, type Playlist } from './supabase'
import { ErrorHandler } from './error-handler'

const errorHandler = ErrorHandler.getInstance()

export interface IntegratedMusicData {
  songs: Song[]
  albums: Album[]
  playlists: Playlist[]
  totalResults: number
  hasMore: boolean
  source: 'supabase' | 'external' | 'mixed'
}

export interface SearchFilters {
  genre?: string
  artist?: string
  album?: string
  duration?: { min?: number; max?: number }
  year?: { min?: number; max?: number }
}

export class MusicIntegrationService {
  private cache = new Map<string, any>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Main search function that combines Supabase and external APIs
  async searchMusic(
    query: string,
    limit = 20,
    filters?: SearchFilters
  ): Promise<IntegratedMusicData> {
    try {
      const cacheKey = `search:${query}:${JSON.stringify(filters)}:${limit}`
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Search both Supabase and external APIs in parallel
      const [supabaseResults, externalResults] = await Promise.allSettled([
        this.searchSupabase(query, Math.ceil(limit / 2), filters),
        this.searchExternal(query, Math.ceil(limit / 2))
      ])

      let songs: Song[] = []
      let albums: Album[] = []
      let playlists: Playlist[] = []
      let source: 'supabase' | 'external' | 'mixed' = 'mixed'

      // Process Supabase results
      if (supabaseResults.status === 'fulfilled' && supabaseResults.value) {
        const supabaseData = supabaseResults.value
        songs.push(...(supabaseData.songs || []))
        albums.push(...(supabaseData.albums || []))
        playlists.push(...(supabaseData.playlists || []))
      }

      // Process external API results
      if (externalResults.status === 'fulfilled' && externalResults.value) {
        const externalSongs = externalResults.value
        const convertedSongs = await this.convertExternalSongs(externalSongs)
        songs.push(...convertedSongs)
      }

      // Determine source
      const hasSupabaseResults = supabaseResults.status === 'fulfilled' && songs.length > 0
      const hasExternalResults = externalResults.status === 'fulfilled' && songs.length > 0

      if (hasSupabaseResults && hasExternalResults) {
        source = 'mixed'
      } else if (hasSupabaseResults) {
        source = 'supabase'
      } else if (hasExternalResults) {
        source = 'external'
      }

      // Remove duplicates and limit results
      songs = this.deduplicateSongs(songs).slice(0, limit)
      albums = albums.slice(0, Math.ceil(limit / 4))
      playlists = playlists.slice(0, Math.ceil(limit / 4))

      const result: IntegratedMusicData = {
        songs,
        albums,
        playlists,
        totalResults: songs.length + albums.length + playlists.length,
        hasMore: songs.length === limit, // Simplified hasMore logic
        source
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return result
    } catch (error) {
      errorHandler.handleError(error, 'MusicIntegrationService.searchMusic')
      
      // Fallback to demo data
      return this.getFallbackMusicData(query, limit)
    }
  }

  // Search Supabase database
  private async searchSupabase(
    query: string,
    limit: number,
    filters?: SearchFilters
  ): Promise<{ songs: Song[]; albums: Album[]; playlists: Playlist[] }> {
    try {
      const { data, error } = await supabaseAPI.searchSongs(query, limit)
      
      if (error) {
        throw error
      }

      return {
        songs: data || [],
        albums: [],
        playlists: []
      }
    } catch (error) {
      console.warn('Supabase search failed:', error)
      return { songs: [], albums: [], playlists: [] }
    }
  }

  // Search external APIs
  private async searchExternal(query: string, limit: number): Promise<ExternalSong[]> {
    try {
      return await musicAPI.searchSongs(query, limit)
    } catch (error) {
      console.warn('External API search failed:', error)
      return []
    }
  }

  // Convert external songs to internal format
  private async convertExternalSongs(externalSongs: ExternalSong[]): Promise<Song[]> {
    return Promise.all(
      externalSongs.map(async (externalSong) => {
        const internalSong = await integrateExternalSong(externalSong)
        return {
          id: externalSong.id,
          title: internalSong.title,
          artist: internalSong.artist,
          album: externalSong.album || 'Unknown Album',
          duration: internalSong.duration,
          url: (internalSong as any).audio_url || externalSong.preview_url || '',
          cover_url: (internalSong as any).cover_image_url || externalSong.cover_image_url,
          genre: (externalSong as any).genre || 'Unknown',
          release_date: (externalSong as any).release_date || new Date().toISOString().split('T')[0],
          play_count: 0,
          likes_count: 0,
          created_at: internalSong.created_at
        } as Song
      })
    )
  }

  // Remove duplicate songs based on title and artist
  private deduplicateSongs(songs: Song[]): Song[] {
    const seen = new Set<string>()
    return songs.filter(song => {
      const key = `${song.title.toLowerCase()}-${song.artist.toLowerCase()}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  // Get trending music from multiple sources
  async getTrendingMusic(limit = 20): Promise<IntegratedMusicData> {
    try {
      const cacheKey = `trending:${limit}`
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Get trending from external API and recent from Supabase
      const [externalTrending, recentSongs] = await Promise.allSettled([
        musicAPI.getTrendingTracks(Math.ceil(limit / 2)),
        supabaseAPI.getTrendingSongs(Math.ceil(limit / 2))
      ])

      let songs: Song[] = []

      // Process external trending
      if (externalTrending.status === 'fulfilled') {
        const convertedSongs = await this.convertExternalSongs(externalTrending.value)
        songs.push(...convertedSongs)
      }

      // Process recent Supabase songs
      if (recentSongs.status === 'fulfilled' && recentSongs.value.data) {
        songs.push(...recentSongs.value.data)
      }

      songs = this.deduplicateSongs(songs).slice(0, limit)

      const result: IntegratedMusicData = {
        songs,
        albums: [],
        playlists: [],
        totalResults: songs.length,
        hasMore: false,
        source: 'mixed'
      }

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return result
    } catch (error) {
      errorHandler.handleError(error, 'MusicIntegrationService.getTrendingMusic')
      return this.getFallbackMusicData('trending', limit)
    }
  }

  // Get popular music from multiple sources
  async getPopularMusic(limit = 20): Promise<IntegratedMusicData> {
    try {
      const cacheKey = `popular:${limit}`
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      const [externalPopular, supabaseAlbums] = await Promise.allSettled([
        musicAPI.getPopularTracks(Math.ceil(limit / 2)),
        supabaseAPI.getTrendingAlbums(10)
      ])

      let songs: Song[] = []
      let albums: Album[] = []

      if (externalPopular.status === 'fulfilled') {
        const convertedSongs = await this.convertExternalSongs(externalPopular.value)
        songs.push(...convertedSongs)
      }

      if (supabaseAlbums.status === 'fulfilled' && supabaseAlbums.value.data) {
        albums.push(...supabaseAlbums.value.data)
      }

      const result: IntegratedMusicData = {
        songs: songs.slice(0, limit),
        albums: albums.slice(0, Math.ceil(limit / 4)),
        playlists: [],
        totalResults: songs.length + albums.length,
        hasMore: false,
        source: 'mixed'
      }

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      return result
    } catch (error) {
      errorHandler.handleError(error, 'MusicIntegrationService.getPopularMusic')
      return this.getFallbackMusicData('popular', limit)
    }
  }

  // Get music by genre
  async getMusicByGenre(genre: string, limit = 20): Promise<IntegratedMusicData> {
    try {
      const [externalSongs, supabaseSongs] = await Promise.allSettled([
        musicAPI.searchSongs(genre, Math.ceil(limit / 2)),
        this.searchSupabase(genre, Math.ceil(limit / 2), { genre })
      ])

      let songs: Song[] = []

      if (externalSongs.status === 'fulfilled') {
        const convertedSongs = await this.convertExternalSongs(externalSongs.value)
        songs.push(...convertedSongs)
      }

      if (supabaseSongs.status === 'fulfilled') {
        songs.push(...supabaseSongs.value.songs)
      }

      songs = this.deduplicateSongs(songs).slice(0, limit)

      return {
        songs,
        albums: [],
        playlists: [],
        totalResults: songs.length,
        hasMore: songs.length === limit,
        source: 'mixed'
      }
    } catch (error) {
      errorHandler.handleError(error, 'MusicIntegrationService.getMusicByGenre')
      return this.getFallbackMusicData(genre, limit)
    }
  }

  // Get artist information from external APIs
  async getArtistInfo(artistName: string) {
    try {
      const cacheKey = `artist:${artistName}`
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      const artistInfo = await musicAPI.getArtistInfo(artistName)
      
      if (artistInfo) {
        this.cache.set(cacheKey, {
          data: artistInfo,
          timestamp: Date.now()
        })
      }

      return artistInfo
    } catch (error) {
      errorHandler.handleError(error, 'MusicIntegrationService.getArtistInfo')
      return null
    }
  }

  // Fallback data when APIs fail
  private getFallbackMusicData(query: string, limit: number): IntegratedMusicData {
    const fallbackSongs: Song[] = [
      {
        id: 'fallback-1',
        title: `Demo Song (${query})`,
        artist: 'Demo Artist',
        album: 'Demo Album',
        duration: 180,
        url: 'https://example.com/demo.mp3',
        cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        genre: 'Demo',
        release_date: '2024-01-01',
        play_count: 0,
        likes_count: 0,
        created_at: new Date().toISOString()
      }
    ]

    return {
      songs: fallbackSongs.slice(0, limit),
      albums: [],
      playlists: [],
      totalResults: Math.min(fallbackSongs.length, limit),
      hasMore: false,
      source: 'external'
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const musicIntegration = new MusicIntegrationService()

// Utility functions for UI integration
export const formatSearchResults = (results: IntegratedMusicData) => {
  return {
    primary: results.songs,
    secondary: [...results.albums, ...results.playlists],
    hasMoreResults: results.hasMore,
    source: results.source,
    isEmpty: results.totalResults === 0
  }
}

export const getSourceBadge = (source: IntegratedMusicData['source']) => {
  switch (source) {
    case 'supabase':
      return { text: 'Local', color: 'blue' }
    case 'external':
      return { text: 'Web', color: 'green' }
    case 'mixed':
      return { text: 'Mixed', color: 'purple' }
    default:
      return { text: 'Unknown', color: 'gray' }
  }
}

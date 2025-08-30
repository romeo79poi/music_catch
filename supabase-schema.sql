-- Supabase database schema for Catch music streaming app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE
);

-- Songs table
CREATE TABLE songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  cover_image_url TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER, -- duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums table
CREATE TABLE albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist songs junction table
CREATE TABLE playlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, song_id)
);

-- User likes table
CREATE TABLE user_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- User listening history
CREATE TABLE listening_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_played INTEGER DEFAULT 0, -- seconds played
  completed BOOLEAN DEFAULT FALSE,
  device_type TEXT DEFAULT 'web',
  ip_address INET,
  user_agent TEXT
);

-- Genres table for better music categorization
CREATE TABLE genres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song genres junction table
CREATE TABLE song_genres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE(song_id, genre_id)
);

-- Artists table for better artist management
CREATE TABLE artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  bio TEXT,
  image_url TEXT,
  social_links JSONB,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song artists junction table (for collaborations)
CREATE TABLE song_artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'performer', -- performer, composer, producer, etc.
  UNIQUE(song_id, artist_id, role)
);

-- User follows (for following artists, users, playlists)
CREATE TABLE user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_type TEXT NOT NULL, -- 'user', 'artist', 'playlist'
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_type, following_id)
);

-- Comments on songs/playlists
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'song', 'playlist', 'album'
  content_id UUID NOT NULL,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  audio_quality TEXT DEFAULT 'high', -- low, medium, high
  auto_play BOOLEAN DEFAULT TRUE,
  notifications JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
  privacy JSONB DEFAULT '{"profile_public": false, "playlists_public": false, "activity_public": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_playlists_created_by ON playlists(created_by);
CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_song_id ON playlist_songs(song_id);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_song_id ON user_likes(song_id);
CREATE INDEX idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX idx_listening_history_song_id ON listening_history(song_id);
CREATE INDEX idx_listening_history_played_at ON listening_history(played_at);
CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_song_genres_song_id ON song_genres(song_id);
CREATE INDEX idx_song_genres_genre_id ON song_genres(genre_id);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_song_artists_song_id ON song_artists(song_id);
CREATE INDEX idx_song_artists_artist_id ON song_artists(artist_id);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_type, following_id);
CREATE INDEX idx_comments_content ON comments(content_type, content_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Everyone can read songs and albums
CREATE POLICY "Anyone can view songs" ON songs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view albums" ON albums
  FOR SELECT USING (true);

-- Users can manage their own playlists
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (auth.uid()::text = created_by::text OR is_public = true);

CREATE POLICY "Users can create playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- Playlist songs policies
CREATE POLICY "Users can view playlist songs" ON playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND (playlists.created_by::text = auth.uid()::text OR playlists.is_public = true)
    )
  );

CREATE POLICY "Users can add songs to own playlists" ON playlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.created_by::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can remove songs from own playlists" ON playlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.created_by::text = auth.uid()::text
    )
  );

-- User likes policies
CREATE POLICY "Users can view own likes" ON user_likes
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own likes" ON user_likes
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Listening history policies
CREATE POLICY "Users can view own history" ON listening_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can add to own history" ON listening_history
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Genres policies (read-only for all users)
CREATE POLICY "Anyone can view genres" ON genres
  FOR SELECT USING (true);

-- Song genres policies (read-only for all users)
CREATE POLICY "Anyone can view song genres" ON song_genres
  FOR SELECT USING (true);

-- Artists policies (read-only for all users)
CREATE POLICY "Anyone can view artists" ON artists
  FOR SELECT USING (true);

-- Song artists policies (read-only for all users)
CREATE POLICY "Anyone can view song artists" ON song_artists
  FOR SELECT USING (true);

-- User follows policies
CREATE POLICY "Users can view all follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid()::text = follower_id::text);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional) - Music streaming demo data
-- Insert genres
INSERT INTO genres (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'Electronic', 'Electronic dance music and synthesizer-based tracks'),
  ('550e8400-e29b-41d4-a716-446655440102', 'Ambient', 'Atmospheric and mood-setting instrumental music'),
  ('550e8400-e29b-41d4-a716-446655440103', 'Pop', 'Popular mainstream music with catchy melodies'),
  ('550e8400-e29b-41d4-a716-446655440104', 'Indie', 'Independent artist music with unique sound'),
  ('550e8400-e29b-41d4-a716-446655440105', 'Synthwave', 'Retro-futuristic electronic music inspired by 80s aesthetics');

-- Insert artists
INSERT INTO artists (id, name, bio, image_url, verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', 'Violet Sounds', 'Dream-pop artist creating ethereal soundscapes with purple-hued aesthetics', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440202', 'Electric Waves', 'Electronic music producer specializing in neon-lit synthwave and ambient textures', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', true),
  ('550e8400-e29b-41d4-a716-446655440203', 'Space Melody', 'Cosmic ambient artist creating interstellar soundtracks for the digital age', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', false);

-- Insert albums
INSERT INTO albums (id, name, artist, cover_image_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Purple Dreams', 'Violet Sounds', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Neon Nights', 'Electric Waves', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Cosmic Journey', 'Space Melody', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Electric Paradise', 'Electric Waves', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Violet Universe', 'Violet Sounds', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop');

-- Insert songs
INSERT INTO songs (id, title, artist, album_id, cover_image_url, duration) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'Purple Rain', 'Violet Sounds', '550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', 210),
  ('550e8400-e29b-41d4-a716-446655440012', 'Midnight Glow', 'Electric Waves', '550e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop', 185),
  ('550e8400-e29b-41d4-a716-446655440013', 'Starlight', 'Space Melody', '550e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop', 195),
  ('550e8400-e29b-41d4-a716-446655440014', 'Dreamscape', 'Violet Sounds', '550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', 240),
  ('550e8400-e29b-41d4-a716-446655440015', 'Electric Feel', 'Electric Waves', '550e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop', 220),
  ('550e8400-e29b-41d4-a716-446655440016', 'Neon Dreams', 'Electric Waves', '550e8400-e29b-41d4-a716-446655440004', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop', 198),
  ('550e8400-e29b-41d4-a716-446655440017', 'Cosmic Waves', 'Space Melody', '550e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop', 267),
  ('550e8400-e29b-41d4-a716-446655440018', 'Violet Storm', 'Violet Sounds', '550e8400-e29b-41d4-a716-446655440005', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', 203);

-- Link songs to artists
INSERT INTO song_artists (song_id, artist_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440201', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440202', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440203', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440201', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440202', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440202', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440203', 'performer'),
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440201', 'performer');

-- Link songs to genres
INSERT INTO song_genres (song_id, genre_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440102'), -- Purple Rain -> Ambient
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440104'), -- Purple Rain -> Indie
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440101'), -- Midnight Glow -> Electronic
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440105'), -- Midnight Glow -> Synthwave
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440102'), -- Starlight -> Ambient
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440103'), -- Dreamscape -> Pop
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440101'), -- Electric Feel -> Electronic
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440105'), -- Neon Dreams -> Synthwave
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440102'), -- Cosmic Waves -> Ambient
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440104'); -- Violet Storm -> Indie

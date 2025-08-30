-- CATCH Music Streaming - Cassandra Schema
-- For distributed and scalable data storage optimized for music streaming
-- Handles time-series data, user activity logs, and high-volume analytics

-- Create keyspace with replication strategy
CREATE KEYSPACE IF NOT EXISTS catch_music
WITH replication = {
    'class': 'NetworkTopologyStrategy',
    'datacenter1': 3,
    'datacenter2': 3
}
AND durable_writes = true;

USE catch_music;

-- User listening history (time-series data)
-- Optimized for queries: "get user's recent listening history"
CREATE TABLE IF NOT EXISTS user_listening_history (
    user_id UUID,
    year INT,
    month INT,
    day INT,
    timestamp TIMESTAMP,
    track_id UUID,
    artist_id UUID,
    album_id UUID,
    track_title TEXT,
    artist_name TEXT,
    album_name TEXT,
    play_duration_ms BIGINT,
    skip_reason TEXT,
    device_type TEXT,
    platform TEXT,
    country TEXT,
    session_id UUID,
    PRIMARY KEY ((user_id, year, month), day, timestamp, track_id)
) WITH CLUSTERING ORDER BY (day DESC, timestamp DESC, track_id ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 1};

-- Track popularity by time (time-series data)
-- Optimized for queries: "get track popularity over time"
CREATE TABLE IF NOT EXISTS track_popularity_timeseries (
    track_id UUID,
    year INT,
    month INT,
    day INT,
    hour INT,
    play_count COUNTER,
    unique_listeners COUNTER,
    skip_count COUNTER,
    like_count COUNTER,
    share_count COUNTER,
    PRIMARY KEY ((track_id, year, month), day, hour)
) WITH CLUSTERING ORDER BY (day DESC, hour DESC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 1};

-- Global trending tracks by location and time
-- Optimized for queries: "get trending tracks by country/region"
CREATE TABLE IF NOT EXISTS trending_tracks_by_location (
    country TEXT,
    year INT,
    month INT,
    day INT,
    hour INT,
    track_id UUID,
    artist_id UUID,
    track_title TEXT,
    artist_name TEXT,
    play_count COUNTER,
    unique_listeners COUNTER,
    trending_score DOUBLE,
    PRIMARY KEY ((country, year, month, day), hour, trending_score, track_id)
) WITH CLUSTERING ORDER BY (hour DESC, trending_score DESC, track_id ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 1};

-- User behavior analytics
-- Optimized for queries: "analyze user behavior patterns"
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    user_id UUID,
    year INT,
    month INT,
    day INT,
    session_id UUID,
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    total_tracks_played INT,
    total_listening_time_ms BIGINT,
    unique_artists_played SET<UUID>,
    unique_genres_played SET<TEXT>,
    skip_rate DOUBLE,
    repeat_rate DOUBLE,
    device_type TEXT,
    platform TEXT,
    country TEXT,
    PRIMARY KEY ((user_id, year, month), day, session_start, session_id)
) WITH CLUSTERING ORDER BY (day DESC, session_start DESC, session_id ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Real-time user activity feed
-- Optimized for queries: "get user's activity feed" and "get follower activities"
CREATE TABLE IF NOT EXISTS user_activity_feed (
    user_id UUID,
    activity_id TIMEUUID,
    activity_type TEXT, -- 'played_track', 'liked_track', 'created_playlist', 'followed_user', etc.
    timestamp TIMESTAMP,
    track_id UUID,
    track_title TEXT,
    artist_id UUID,
    artist_name TEXT,
    playlist_id UUID,
    playlist_name TEXT,
    target_user_id UUID,
    target_username TEXT,
    metadata MAP<TEXT, TEXT>, -- Additional activity metadata
    PRIMARY KEY (user_id, activity_id)
) WITH CLUSTERING ORDER BY (activity_id DESC)
AND gc_grace_seconds = 2592000 -- 30 days
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Social feed for followers
-- Optimized for queries: "get activities from users I follow"
CREATE TABLE IF NOT EXISTS social_feed (
    follower_id UUID,
    activity_id TIMEUUID,
    user_id UUID, -- User who performed the activity
    username TEXT,
    activity_type TEXT,
    timestamp TIMESTAMP,
    track_id UUID,
    track_title TEXT,
    artist_name TEXT,
    playlist_id UUID,
    playlist_name TEXT,
    metadata MAP<TEXT, TEXT>,
    PRIMARY KEY (follower_id, activity_id)
) WITH CLUSTERING ORDER BY (activity_id DESC)
AND gc_grace_seconds = 2592000 -- 30 days
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Track recommendations cache
-- Optimized for queries: "get personalized recommendations for user"
CREATE TABLE IF NOT EXISTS user_recommendations (
    user_id UUID,
    recommendation_type TEXT, -- 'daily_mix', 'discover_weekly', 'based_on_listening', etc.
    generated_at TIMESTAMP,
    track_id UUID,
    track_title TEXT,
    artist_id UUID,
    artist_name TEXT,
    album_id UUID,
    album_name TEXT,
    score DOUBLE,
    reason TEXT, -- Why this track was recommended
    PRIMARY KEY ((user_id, recommendation_type), generated_at, score, track_id)
) WITH CLUSTERING ORDER BY (generated_at DESC, score DESC, track_id ASC)
AND gc_grace_seconds = 604800 -- 7 days
AND default_time_to_live = 604800; -- Recommendations expire after 7 days

-- Search query analytics
-- Optimized for queries: "analyze search patterns and improve search algorithms"
CREATE TABLE IF NOT EXISTS search_analytics (
    search_date DATE,
    query_hash TEXT, -- Hash of the search query for privacy
    query TEXT,
    user_id UUID,
    timestamp TIMESTAMP,
    result_count INT,
    clicked_result_id UUID,
    clicked_result_type TEXT, -- 'track', 'artist', 'album', 'playlist'
    clicked_position INT,
    session_id UUID,
    country TEXT,
    PRIMARY KEY (search_date, query_hash, timestamp, user_id)
) WITH CLUSTERING ORDER BY (query_hash ASC, timestamp DESC, user_id ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Artist analytics
-- Optimized for queries: "get artist performance analytics"
CREATE TABLE IF NOT EXISTS artist_analytics (
    artist_id UUID,
    year INT,
    month INT,
    day INT,
    total_plays COUNTER,
    unique_listeners COUNTER,
    total_likes COUNTER,
    total_shares COUNTER,
    total_saves COUNTER,
    follower_count COUNTER,
    countries_played_in SET<TEXT>,
    top_tracks LIST<UUID>,
    PRIMARY KEY ((artist_id, year, month), day)
) WITH CLUSTERING ORDER BY (day DESC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 1};

-- Playlist collaboration activity
-- Optimized for queries: "track collaborative playlist changes"
CREATE TABLE IF NOT EXISTS playlist_activity (
    playlist_id UUID,
    activity_id TIMEUUID,
    user_id UUID,
    username TEXT,
    activity_type TEXT, -- 'track_added', 'track_removed', 'track_reordered', etc.
    timestamp TIMESTAMP,
    track_id UUID,
    track_title TEXT,
    artist_name TEXT,
    old_position INT,
    new_position INT,
    PRIMARY KEY (playlist_id, activity_id)
) WITH CLUSTERING ORDER BY (activity_id DESC)
AND gc_grace_seconds = 2592000 -- 30 days
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Device and platform analytics
-- Optimized for queries: "understand user device preferences and platform usage"
CREATE TABLE IF NOT EXISTS device_analytics (
    date DATE,
    device_type TEXT, -- 'mobile', 'desktop', 'tablet', 'smart_speaker', etc.
    platform TEXT, -- 'ios', 'android', 'web', 'macos', 'windows', etc.
    country TEXT,
    user_count COUNTER,
    session_count COUNTER,
    total_listening_time_ms COUNTER,
    unique_tracks_played COUNTER,
    PRIMARY KEY ((date, device_type), platform, country)
) WITH CLUSTERING ORDER BY (platform ASC, country ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 30};

-- Real-time streaming sessions
-- Optimized for queries: "track active streaming sessions"
CREATE TABLE IF NOT EXISTS streaming_sessions (
    session_id UUID,
    user_id UUID,
    start_time TIMESTAMP,
    last_activity TIMESTAMP,
    device_type TEXT,
    platform TEXT,
    ip_address TEXT,
    country TEXT,
    current_track_id UUID,
    current_track_title TEXT,
    current_artist_name TEXT,
    queue LIST<UUID>, -- Upcoming tracks in queue
    is_active BOOLEAN,
    PRIMARY KEY (session_id)
) WITH default_time_to_live = 86400; -- Sessions expire after 24 hours

-- User session by user (for finding active sessions per user)
CREATE TABLE IF NOT EXISTS user_sessions_by_user (
    user_id UUID,
    session_id UUID,
    start_time TIMESTAMP,
    last_activity TIMESTAMP,
    device_type TEXT,
    platform TEXT,
    is_active BOOLEAN,
    PRIMARY KEY (user_id, session_id)
) WITH CLUSTERING ORDER BY (session_id DESC)
AND default_time_to_live = 86400; -- Sessions expire after 24 hours

-- Track skip analysis
-- Optimized for queries: "analyze track skip patterns to improve recommendations"
CREATE TABLE IF NOT EXISTS track_skip_analysis (
    track_id UUID,
    skip_position_ms BIGINT, -- Position in track where skip occurred
    skip_percentage DOUBLE,
    date DATE,
    user_demographics TEXT, -- Age group, gender, etc. (anonymized)
    skip_count COUNTER,
    total_plays COUNTER,
    PRIMARY KEY ((track_id, skip_position_ms), date, user_demographics)
) WITH CLUSTERING ORDER BY (date DESC, user_demographics ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'DAYS', 'compaction_window_size': 7};

-- Content delivery metrics
-- Optimized for queries: "monitor CDN performance and optimize content delivery"
CREATE TABLE IF NOT EXISTS content_delivery_metrics (
    date DATE,
    hour INT,
    country TEXT,
    cdn_node TEXT,
    track_id UUID,
    request_count COUNTER,
    bytes_served COUNTER,
    avg_response_time_ms COUNTER,
    error_count COUNTER,
    cache_hit_rate DOUBLE,
    PRIMARY KEY ((date, hour), country, cdn_node, track_id)
) WITH CLUSTERING ORDER BY (country ASC, cdn_node ASC, track_id ASC)
AND gc_grace_seconds = 864000
AND compaction = {'class': 'TimeWindowCompactionStrategy', 'compaction_window_unit': 'HOURS', 'compaction_window_size': 6};

-- Materialized views for common queries

-- Most played tracks by user (recent)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_top_tracks_recent AS
    SELECT user_id, track_id, track_title, artist_name, count(*) as play_count
    FROM user_listening_history
    WHERE user_id IS NOT NULL 
      AND year IS NOT NULL 
      AND month IS NOT NULL 
      AND day IS NOT NULL 
      AND timestamp IS NOT NULL 
      AND track_id IS NOT NULL
      AND track_title IS NOT NULL
      AND artist_name IS NOT NULL
    PRIMARY KEY ((user_id), play_count, track_id)
    WITH CLUSTERING ORDER BY (play_count DESC, track_id ASC);

-- Global top tracks by day
CREATE MATERIALIZED VIEW IF NOT EXISTS global_top_tracks_daily AS
    SELECT country, year, month, day, track_id, track_title, artist_name, sum(play_count) as total_plays
    FROM trending_tracks_by_location
    WHERE country IS NOT NULL 
      AND year IS NOT NULL 
      AND month IS NOT NULL 
      AND day IS NOT NULL 
      AND track_id IS NOT NULL
      AND track_title IS NOT NULL
      AND artist_name IS NOT NULL
    PRIMARY KEY ((year, month, day), total_plays, track_id)
    WITH CLUSTERING ORDER BY (total_plays DESC, track_id ASC);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS ON user_listening_history (track_id);
CREATE INDEX IF NOT EXISTS ON user_listening_history (artist_id);
CREATE INDEX IF NOT EXISTS ON track_popularity_timeseries (year);
CREATE INDEX IF NOT EXISTS ON user_activity_feed (activity_type);
CREATE INDEX IF NOT EXISTS ON search_analytics (user_id);
CREATE INDEX IF NOT EXISTS ON artist_analytics (year);

-- Sample data for testing
-- Note: In production, this would be populated by your application services

-- Insert sample user listening history
INSERT INTO user_listening_history (
    user_id, year, month, day, timestamp, track_id, artist_id, album_id,
    track_title, artist_name, album_name, play_duration_ms, device_type, platform, country
) VALUES (
    550e8400-e29b-41d4-a716-446655440001, 2024, 1, 15, '2024-01-15 10:30:00+0000',
    550e8400-e29b-41d4-a716-446655440030, 550e8400-e29b-41d4-a716-446655440010, 550e8400-e29b-41d4-a716-446655440020,
    'Amazing Song', 'The Music Artist', 'Greatest Hits', 165000, 'mobile', 'ios', 'US'
);

INSERT INTO user_listening_history (
    user_id, year, month, day, timestamp, track_id, artist_id, album_id,
    track_title, artist_name, album_name, play_duration_ms, device_type, platform, country
) VALUES (
    550e8400-e29b-41d4-a716-446655440001, 2024, 1, 15, '2024-01-15 10:33:00+0000',
    550e8400-e29b-41d4-a716-446655440031, 550e8400-e29b-41d4-a716-446655440010, 550e8400-e29b-41d4-a716-446655440020,
    'Another Hit', 'The Music Artist', 'Greatest Hits', 210000, 'mobile', 'ios', 'US'
);

-- Update track popularity counters
UPDATE track_popularity_timeseries 
SET play_count = play_count + 1, unique_listeners = unique_listeners + 1
WHERE track_id = 550e8400-e29b-41d4-a716-446655440030 AND year = 2024 AND month = 1 AND day = 15 AND hour = 10;

UPDATE track_popularity_timeseries 
SET play_count = play_count + 1, unique_listeners = unique_listeners + 1
WHERE track_id = 550e8400-e29b-41d4-a716-446655440031 AND year = 2024 AND month = 1 AND day = 15 AND hour = 10;

-- Add trending tracks data
UPDATE trending_tracks_by_location
SET play_count = play_count + 1, unique_listeners = unique_listeners + 1
WHERE country = 'US' AND year = 2024 AND month = 1 AND day = 15 AND hour = 10 
  AND track_id = 550e8400-e29b-41d4-a716-446655440030;

-- Insert user activity
INSERT INTO user_activity_feed (
    user_id, activity_id, activity_type, timestamp, track_id, track_title, artist_name
) VALUES (
    550e8400-e29b-41d4-a716-446655440001, now(), 'played_track', '2024-01-15 10:30:00+0000',
    550e8400-e29b-41d4-a716-446655440030, 'Amazing Song', 'The Music Artist'
);

-- Insert user recommendations
INSERT INTO user_recommendations (
    user_id, recommendation_type, generated_at, track_id, track_title, 
    artist_name, score, reason
) VALUES (
    550e8400-e29b-41d4-a716-446655440001, 'daily_mix', '2024-01-15 08:00:00+0000',
    550e8400-e29b-41d4-a716-446655440031, 'Another Hit', 'The Music Artist', 0.95,
    'Based on your recent listening to similar artists'
);

-- Best practices for Cassandra in production:
-- 1. Use appropriate replication factor (RF=3 for production)
-- 2. Monitor compaction strategies and adjust based on workload
-- 3. Use time-based partitioning for time-series data
-- 4. Implement proper TTL for data that doesn't need to be stored forever
-- 5. Monitor partition sizes and avoid large partitions (>100MB)
-- 6. Use materialized views sparingly and only for essential queries
-- 7. Implement proper monitoring with tools like DataStax OpsCenter
-- 8. Regular backups and disaster recovery procedures
-- 9. Tune JVM and OS settings for optimal performance
-- 10. Use batch statements carefully to avoid hotspots

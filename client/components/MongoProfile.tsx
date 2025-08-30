import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authAPI } from '@/lib/auth-mongodb';

interface User {
  _id: string;
  email: string;
  username: string;
  name: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_verified: boolean;
  is_artist: boolean;
  follower_count: number;
  following_count: number;
  created_at: string;
  last_login?: string;
}

const MongoProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [editData, setEditData] = useState({
    name: '',
    display_name: '',
    bio: '',
    profile_image_url: '',
  });

  // Load user profile on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await authAPI.getProfile();
      
      if (result.success && result.user) {
        setUser(result.user);
        setEditData({
          name: result.user.name || '',
          display_name: result.user.display_name || '',
          bio: result.user.bio || '',
          profile_image_url: result.user.profile_image_url || '',
        });
      } else {
        setError(result.message || 'Failed to load profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const result = await authAPI.updateProfile(editData);

      if (result.success && result.user) {
        setUser(result.user);
        setSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Profile update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/login'; // Redirect to login page
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load profile. Please try logging in again.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleLogout}>Go to Login</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile_image_url} />
              <AvatarFallback className="text-lg">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.display_name || user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.is_verified && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            <div className="flex gap-4 text-sm">
              <span>{user.follower_count} followers</span>
              <span>{user.following_count} following</span>
              {user.is_artist && <span>🎵 Artist</span>}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {user.bio || 'No bio available'}
          </p>
          <div className="text-xs text-muted-foreground">
            <p>Email: {user.email}</p>
            <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            {user.last_login && (
              <p>Last login: {new Date(user.last_login).toLocaleString()}</p>
            )}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={editData.display_name}
                onChange={handleInputChange}
                placeholder="How others see your name"
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={editData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_image_url">Profile Image URL</Label>
              <Input
                id="profile_image_url"
                name="profile_image_url"
                value={editData.profile_image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/your-image.jpg"
                disabled={updating}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={updating}>
              {updating ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MongoProfile;

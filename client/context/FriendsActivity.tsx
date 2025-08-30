import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "./AuthContext";
import { useMusic } from "./MusicContextSupabase";
import { HeadphonesIcon, Music, Users } from "lucide-react";
import { useEffect, useState } from "react";

const FriendsActivity = () => {
	const [users, setUsers] = useState<any[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
	const [userActivities, setUserActivities] = useState<any[]>([]);
	const { user } = useAuth();
	const { friendsActivity } = useMusic();

	useEffect(() => {
		// Update activities when friendsActivity changes
		if (friendsActivity) {
			setUserActivities(friendsActivity);
		}
	}, [friendsActivity]);

	if (!user) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center space-x-2">
				<Users className="h-4 w-4" />
				<h3 className="font-semibold">Friends Activity</h3>
			</div>
			<ScrollArea className="h-[300px]">
				<div className="space-y-2">
					{userActivities.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p>No recent activity</p>
						</div>
					) : (
						userActivities.map((activity, index) => (
							<div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
								<Avatar className="h-8 w-8">
									<AvatarImage src={activity.user?.avatar_url} />
									<AvatarFallback>
										{activity.user?.name?.charAt(0) || 'U'}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{activity.user?.name || 'Unknown User'}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{activity.activity_type === 'listening' ? '🎵 Listening to music' :
										 activity.activity_type === 'liked' ? '❤️ Liked a song' :
										 activity.activity_type === 'shared' ? '📤 Shared a song' :
										 activity.activity_type === 'created_playlist' ? '📋 Created a playlist' :
										 'Activity'}
									</p>
								</div>
								<div className="flex items-center space-x-1">
									{onlineUsers.has(activity.user_id) && (
										<div className="h-2 w-2 bg-green-500 rounded-full" />
									)}
									<HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default FriendsActivity;

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { Camera, Clock, Heart, MessagesSquare, Trophy, Globe, Search, PlusCircle, Bell, User, MapPin, Users, Plus } from 'lucide-react';
import { Prompt } from 'next/font/google';
import ProfileImage from '@/components/ProfileImage';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

interface DatePost {
  id: string;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  venue: string;
  created_at: string;
  watcher_votes: number;
  comments_count: number;
  hasLiked: boolean;
  proof_media_url: string | null;
}

interface DatabasePost {
  id: string;
  venue: string;
  created_at: string;
  watcher_votes: number;
  proof_media_url: string | null;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  venues: {
    name: string;
  } | null;
}

interface Group {
  id: string;
  name: string;
  group_photo_url?: string | null;
}

interface GroupMember {
  group_id: string;
  groups: Group;
}

interface LiveDate {
  id: string;
  venue: string;
  created_at: string;
  watcher_votes: number;
  challenge_title: string;
  user_id: string;
  first_name: string;
  avatar_url: string | null;
  challenge_points: number;
  latitude: number | null;
  longitude: number | null;
  visibility: string;
  group_id: string;
  groups: {
    name: string;
  } | null;
}

interface User {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [datePosts, setDatePosts] = useState<DatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<DatePost | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    // Get current user and their groups
    const getCurrentUserAndGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({
          id: user.id,
          first_name: user.user_metadata.first_name,
          avatar_url: user.user_metadata.avatar_url
        });
        
        // Fetch user's groups with complete group details including photo
        const { data: groupsData } = await supabase
          .from('group_members')
          .select(`
            groups (
              id,
              name,
              group_photo_url
            )
          `)
          .eq('user_id', user.id);

        if (groupsData) {
          const groups: Group[] = groupsData.map((g: any) => ({
            id: g.groups.id,
            name: g.groups.name,
            group_photo_url: g.groups.group_photo_url
          }));
          setUserGroups(groups);
        }
      }
    };
    getCurrentUserAndGroups();
  }, []);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      // Check if user has already liked
      const { data: existingLikes, error: likeError } = await supabase
        .from('date_likes')
        .select('*')
        .eq('date_request_id', postId)
        .eq('user_id', currentUser.id);

      if (likeError) throw likeError;

      const existingLike = existingLikes?.[0];

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('date_likes')
          .delete()
          .eq('date_request_id', postId)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;

        // Update local state
        setDatePosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, watcher_votes: Math.max(0, post.watcher_votes - 1), hasLiked: false }
            : post
        ));

        toast.success('Like removed');
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('date_likes')
          .insert({ 
            date_request_id: postId, 
            user_id: currentUser.id,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        // Update local state
        setDatePosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, watcher_votes: post.watcher_votes + 1, hasLiked: true }
            : post
        ));

        toast.success('Post liked!');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = (post: DatePost) => {
    router.push(`/date/${post.id}/comments`);
  };

  const handleShowMap = (post: DatePost) => {
    setSelectedPost(post);
    setShowMap(true);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedTab(groupId);
    setShowGroupMenu(false);
    const selectedGroup = userGroups.find(g => g.id === groupId);
    setSelectedGroup(selectedGroup || null);
  };

  const handleDelete = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('date_requests')
        .update({ status: 'deleted' })
        .eq('id', postId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Update local state
      setDatePosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const fetchDatePosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts, error } = await supabase
        .from('date_requests')
        .select(`
          id,
          venue,
          created_at,
          watcher_votes,
          proof_media_url,
          profiles!date_requests_sender_id_fkey (
            id,
            first_name,
            avatar_url
          ),
          venues (
            name
          )
        `)
        .in('status', ['completed', 'rated'])
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the DatePost type
      const transformedPosts = await Promise.all((posts || []).map(async post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        const venue = Array.isArray(post.venues) ? post.venues[0] : post.venues;
        
        // Transform proof_media_url to get the public URL
        let proofUrl = post.proof_media_url;
        if (proofUrl && !proofUrl.startsWith('http')) {
          const cleanPath = proofUrl.replace(/^date-proofs\//, '');
          const { data } = supabase.storage
            .from('date-proofs')
            .getPublicUrl(cleanPath);
          proofUrl = data?.publicUrl;
        }

        // Check if the current user has liked this post
        const { data: likes } = await supabase
          .from('date_likes')
          .select('*')
          .eq('date_request_id', post.id)
          .eq('user_id', user.id);

        const hasLiked = Boolean(likes && likes.length > 0);

        return {
          id: post.id,
          user: {
            id: profile.id,
            first_name: profile.first_name,
            avatar_url: profile.avatar_url
          },
          venue: venue?.name || post.venue,
          created_at: post.created_at,
          watcher_votes: post.watcher_votes || 0,
          comments_count: 0,
          proof_media_url: proofUrl,
          hasLiked
        };
      }));

      setDatePosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatePosts();
  }, [currentUser, selectedTab]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#cc0000]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#cc0000] text-white pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <Header variant="dashboard" />

        <div className="sticky top-0 bg-[#cc0000] pb-4 mb-6 pt-4 z-50">
          <div className="flex flex-col mt-4">
            <div className="flex justify-end items-center">
              <button 
                onClick={() => setSelectedTab('all')}
                title="All Posts"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  selectedTab === 'all' 
                    ? 'bg-white text-[#cc0000]' 
                    : 'bg-[#aa0000] text-white hover:bg-[#990000]'
                }`}
              >
                <Globe className="w-4 h-4" />
              </button>

              <div className="relative ml-2">
                <button
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="w-8 h-8 rounded-full bg-[#aa0000] hover:bg-[#990000] flex items-center justify-center transition-colors"
                >
                  <Users className="w-4 h-4 text-white" />
                </button>

                {showGroupMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[20px] shadow-lg border-2 border-[#cc0000] overflow-hidden">
                    <Link
                      href="/groups/create"
                      className="block px-4 py-2 text-[#cc0000] hover:bg-[#cc0000] hover:text-white transition-colors text-sm font-medium border-b border-[#cc0000]/10 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Group
                    </Link>
                    {userGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupSelect(group.id)}
                        className="w-full px-4 py-2 text-[#cc0000] hover:bg-[#cc0000] hover:text-white transition-colors text-sm text-left flex items-center gap-2"
                      >
                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                          <Image
                            src={group.group_photo_url || '/images/default-group-photo.png'}
                            alt={group.name}
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </div>
                        {group.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedGroup && (
              <div className="flex flex-col items-center justify-center mt-8 mb-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white mb-4">
                  <Image
                    src={selectedGroup.group_photo_url || '/images/default-group-photo.png'}
                    alt={selectedGroup.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-3xl font-bold text-white">{selectedGroup.name}</h2>
                  <Link 
                    href={`/groups/${selectedGroup.id}`}
                    className="px-4 py-1.5 bg-white text-[#cc0000] rounded-full text-xs font-medium hover:bg-white/90 transition-colors"
                  >
                    View Group
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {datePosts.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg ${prompt.className}`}>
                {selectedTab !== 'all' ? "No posts in this group yet" : "No posts to show"}
              </p>
            </div>
          ) : (
            datePosts.map((post) => (
              <div key={post.id} className="bg-[#aa0000] mb-6 overflow-hidden rounded-lg">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
                      <ProfileImage user={post.user} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className={`text-white text-lg font-medium ${prompt.className}`}>{post.user.first_name}</div>
                      <div className={`text-white/80 text-sm ${prompt.className}`}>
                        {post.venue}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-white/80 text-sm ${prompt.className}`}>
                      {formatTimeAgo(post.created_at)}
                    </div>
                    {currentUser?.id === post.user.id && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative aspect-[3/4] bg-gray-900">
                  {post.proof_media_url ? (
                    <img 
                      src={post.proof_media_url}
                      alt="Date moment" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-black">
                      <span className={`text-white/50 ${prompt.className}`}>No photo yet</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-white/80">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Heart 
                        className={`w-5 h-5 ${post.hasLiked ? 'fill-white text-white' : ''}`} 
                      />
                      <span className={prompt.className}>{post.watcher_votes}</span>
                    </button>
                    <button
                      onClick={() => handleComment(post)}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <MessagesSquare className="w-5 h-5" />
                      <span className={prompt.className}>{post.comments_count}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showMap && selectedPost && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden">
            <div className="p-4 bg-[#cc0000] text-white flex justify-between items-center">
              <h3 className={`font-medium ${prompt.className}`}>{selectedPost.venue}</h3>
              <button 
                onClick={() => setShowMap(false)}
                className="text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="h-[400px] w-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">{selectedPost.venue}</h3>
                <p className="text-gray-500">Location details coming soon</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
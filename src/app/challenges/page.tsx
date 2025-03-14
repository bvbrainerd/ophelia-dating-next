'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Flame, Heart, ThumbsUp, MessageCircle, MapPin, Camera } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VenueSelector from '@/components/VenueSelector';
import Map from '@/components/Map';
import { VENUES } from '@/utils/venues';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'adventurous' | 'daredevil';
  points: number;
  total_completions: number;
  total_votes: number;
  type: 'date_invite' | 'date_activity';
  venue?: string;
  penalty?: {
    type: 'dare' | 'rating' | 'shame' | 'escalation' | 'financial';
    description: string;
  };
}

interface DatePartner {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age: number;
  bio: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
}

interface Rating {
  venue_rating: number;
  venue_review: string;
  date_rating: number;
  date_review: string;
  date_partner_rating: number;
  date_partner_review: string;
}

interface UserChallenge {
  id: string;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  date_partner?: DatePartner;
  challenge: {
    title: string;
    description: string;
    level: string;
    points: number;
    type: 'date_invite' | 'date_activity';
  };
  venue: string;
  date_time: string;
  watcher_votes: number;
  status: string;
  proof_media_url?: string | null;
  visibility: string;
  group_ids: string[];
  rating?: Rating;
}

interface DatabaseProfile {
  id: string;
  first_name: string;
  last_name?: string;
  avatar_url: string | null;
  age?: number;
  bio?: string;
}

interface DatabaseChallenge {
  id: string;
  title: string;
  description: string;
  level: string;
  points: number;
  type: 'date_invite' | 'date_activity';
}

interface DatabaseDateRequest {
  venue: string;
  proposed_time: string;
}

interface DatabaseUserChallenge {
  id: string;
  status: string;
  watcher_votes: number;
  proof_media_url: string | null;
  visibility: string;
  group_ids: string[];
  date_partner: DatabaseProfile | null;
  date_requests: DatabaseDateRequest;
  profiles: DatabaseProfile;
  date_challenges: DatabaseChallenge;
}

interface GroupMemberResponse {
  groups: {
    id: string;
    name: string;
    description: string;
  };
}

export default function ChallengesPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('post');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'groups' | 'private'>('public');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'adventurous' | 'daredevil'>('adventurous');
  const [selectedChallengeType, setSelectedChallengeType] = useState<'date_invite' | 'date_activity'>('date_invite');
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [datePartner, setDatePartner] = useState<DatePartner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DatePartner[]>([]);
  const [ratings, setRatings] = useState<Rating>({
    venue_rating: 0,
    venue_review: '',
    date_rating: 0,
    date_review: '',
    date_partner_rating: 0,
    date_partner_review: ''
  });
  const [venue, setVenue] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-71.0589, 42.3601]); // Boston center
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [venues, setVenues] = useState<Record<string, any[]>>({});
  const [selectedDareUser, setSelectedDareUser] = useState<DatePartner | null>(null);
  const [dareUserSearch, setDareUserSearch] = useState('');
  const [dareUserResults, setDareUserResults] = useState<DatePartner[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [customChallengeTitle, setCustomChallengeTitle] = useState('');
  const [customChallengeDescription, setCustomChallengeDescription] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState('48 hours');
  const [selectedProof, setSelectedProof] = useState('Photo');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const venueDares: Challenge[] = [
    {
      id: 'puttshack-1',
      title: 'Puttshack Mini Golf Date',
      description: 'Ask someone to join you for a competitive round of mini golf at Puttshack this Saturday. Loser buys drinks!',
      points: 100,
      total_completions: 0,
      total_votes: 0,
      type: 'date_invite',
      venue: 'Puttshack',
      level: 'adventurous'
    },
    {
      id: 'luckystrike-1',
      title: 'Lucky Strike Bowling Night',
      description: 'Challenge someone to a bowling date at Lucky Strike. Winner gets to choose the next spot!',
      points: 100,
      total_completions: 0,
      total_votes: 0,
      type: 'date_invite',
      venue: 'Lucky Strike',
      level: 'beginner'
    },
    {
      id: 'barcelona-1',
      title: 'Barcelona Wine Bar Romance',
      description: 'Invite someone for tapas and wine tasting at Barcelona Wine Bar. Must try at least 3 different wines!',
      points: 150,
      total_completions: 0,
      total_votes: 0,
      type: 'date_invite',
      venue: 'Barcelona Wine Bar',
      level: 'adventurous'
    },
    {
      id: 'blueribbonsushi-1',
      title: 'Blue Ribbon Sushi Adventure',
      description: 'Ask someone to join you for an omakase experience at Blue Ribbon Sushi. No California rolls allowed!',
      points: 200,
      total_completions: 0,
      total_votes: 0,
      type: 'date_invite',
      venue: 'Blue Ribbon Sushi',
      level: 'daredevil'
    }
  ];

  const dateActivities: Challenge[] = [
    {
      id: 'switch-drinks',
      title: '🍸 Switch Drinks Challenge',
      description: 'Order a drink and swap after the first sip—no take-backs.',
      points: 50,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'beginner',
      penalty: {
        type: 'dare',
        description: 'Post a video confessing why you were too scared to try your date\'s drink'
      }
    },
    {
      id: 'first-bite',
      title: '🍽️ First Bite Power Move',
      description: 'Take the first bite of your date\'s meal without asking.',
      points: 75,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'adventurous',
      penalty: {
        type: 'rating',
        description: 'Your adventurous rating decreases by 1 star'
      }
    },
    {
      id: 'no-names',
      title: '🎭 No Names Allowed',
      description: 'You can\'t say each other\'s names for the next 30 minutes—slip up, take a sip.',
      points: 50,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'beginner'
    },
    {
      id: 'truth-bill',
      title: '💸 Truth for the Bill',
      description: 'Ask each other a bold truth question. Whoever refuses to answer pays.',
      points: 100,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'adventurous'
    },
    {
      id: 'eye-contact',
      title: '🔥 60-Second Eye Contact',
      description: 'No talking, just hold eye contact for a full minute—first to break it takes a sip.',
      points: 75,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'adventurous'
    },
    {
      id: 'deepest-fear',
      title: '🖤 Deepest Fear Swap',
      description: 'Each of you confesses something that genuinely scares you.',
      points: 150,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'daredevil'
    },
    {
      id: 'kiss-shot',
      title: '💋 Kiss or Shot',
      description: 'Either share a quick kiss or both take a shot—your choice.',
      points: 100,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'daredevil'
    },
    {
      id: 'bold-whisper',
      title: '🎶 Whisper in My Ear',
      description: 'Lean in and whisper the boldest thing you\'re thinking right now.',
      points: 75,
      total_completions: 0,
      total_votes: 0,
      type: 'date_activity',
      level: 'adventurous'
    }
  ];

  const cancelMessages = [
    "Oh you're backing out? You sure about that?",
    "Ophelia doesn't like quitters. Good luck getting your next date",
    "You backed out. Now you owe us one",
    "Be honest. Was it really about them or are you afraid of something deeper?",
    "Tell me. Do you even want to date? Or do you just like the idea of it?",
    "You keep running, but you're only running farther from yourself.",
    "I see what's happening. You want to connect, but every time it gets real, you pull away."
  ];

  useEffect(() => {
    // Fetch venues from your venue data
    const fetchVenues = async () => {
      try {
        const { data: venueData } = await supabase
          .from('venues')
          .select('*')
          .order('name');

        if (venueData) {
          // Group venues by category
          const groupedVenues = venueData.reduce((acc: Record<string, any[]>, venue) => {
            const category = venue.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(venue);
            return acc;
          }, {});
          setVenues(groupedVenues);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    };

    fetchVenues();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Fetch user's groups through group_members table
        const { data: userGroupsData } = await supabase
          .from('group_members')
          .select(`
            groups!inner (
              id,
              name,
              description
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .returns<GroupMemberResponse[]>();

        if (userGroupsData) {
          // Extract groups from the joined data and ensure correct typing
          const groups: Group[] = userGroupsData.map(item => ({
            id: item.groups.id,
            name: item.groups.name,
            description: item.groups.description
          }));
          setUserGroups(groups);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleVenueSelect = (selectedVenue: string) => {
    setVenue(selectedVenue);
    // Find venue coordinates
    const allVenues = Object.values(VENUES).flat();
    const selectedVenueData = allVenues.find(v => v.name === selectedVenue);
    if (selectedVenueData) {
      setMapCenter(selectedVenueData.coordinates);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedImage || !venue) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload image
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('challenge-proofs')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('challenge-proofs')
        .getPublicUrl(fileName);

      // Create challenge entry
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          date_partner_id: datePartner?.id,
          venue,
          proof_media_url: publicUrl,
          visibility,
          status: 'completed',
          group_ids: visibility === 'groups' ? selectedGroups : [],
          ratings
        });

      if (challengeError) throw challengeError;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('challenge_watchers')
        .select('id')
        .eq('user_challenge_id', challengeId)
        .eq('watcher_id', user.id)
        .single();

      if (existingVote) {
        // Remove vote
        await supabase
          .from('challenge_watchers')
          .delete()
          .eq('id', existingVote.id);

        // Update local state
        setActiveChallenges(prev => 
          prev.map(c => 
            c.id === challengeId 
              ? { ...c, watcher_votes: c.watcher_votes - 1 }
              : c
          )
        );
      } else {
        // Add vote
        await supabase
          .from('challenge_watchers')
          .insert({
            user_challenge_id: challengeId,
            watcher_id: user.id,
            vote_type: 'upvote'
          });

        // Update local state
        setActiveChallenges(prev => 
          prev.map(c => 
            c.id === challengeId 
              ? { ...c, watcher_votes: c.watcher_votes + 1 }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) return [];

    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, age, bio')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      return users as DatePartner[];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  useEffect(() => {
    const searchDatePartners = async () => {
      if (searchQuery) {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchDatePartners, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const searchDareUsers = async () => {
      if (dareUserSearch) {
        const results = await searchUsers(dareUserSearch);
        setDareUserResults(results);
      } else {
        setDareUserResults([]);
      }
    };

    const debounceTimer = setTimeout(searchDareUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [dareUserSearch]);

  useEffect(() => {
    // Filter challenges based on type and level
    const availableChallenges = selectedChallengeType === 'date_invite' 
      ? venueDares.filter(c => c.level === selectedLevel)
      : dateActivities.filter(c => c.level === selectedLevel);
    
    setChallenges(availableChallenges);
  }, [selectedChallengeType, selectedLevel]);

  const handleDareSubmit = async (challenge: Challenge) => {
    if (!selectedDareUser) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create challenge entry
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: selectedDareUser.id,
          challenger_id: user.id,
          challenge_id: challenge.id,
          status: 'pending',
          type: selectedChallengeType,
          points_earned: 0,
          deadline: selectedDeadline,
          proof_type: selectedProof.toLowerCase(),
          custom_challenge: challenge.id.startsWith('custom-') ? {
            title: challenge.title,
            description: challenge.description,
            level: challenge.level,
            points: challenge.points
          } : null
        });

      if (challengeError) throw challengeError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedDareUser.id,
          type: selectedChallengeType === 'date_invite' ? 'date_invite' : 'date_dare',
          title: selectedChallengeType === 'date_invite' 
            ? 'New Date Invite!' 
            : 'New Date Dare!',
          message: selectedChallengeType === 'date_invite'
            ? `${user.user_metadata.first_name} dared you to go on a date!`
            : `${user.user_metadata.first_name} dared you to complete a challenge on your date!`,
          data: {
            challenge_id: challenge.id,
            challenger_id: user.id,
            deadline: selectedDeadline,
            proof_type: selectedProof.toLowerCase()
          }
        });

      if (notificationError) throw notificationError;

      toast.success(
        selectedChallengeType === 'date_invite'
          ? 'Date invite sent successfully!'
          : 'Dare sent successfully!'
      );

      // Reset state
      setSelectedDareUser(null);
      setDareUserSearch('');
      setDareUserResults([]);
      setSelectedChallenge(null);
      setCustomChallengeTitle('');
      setCustomChallengeDescription('');
      setSelectedDeadline('48 hours');
      setSelectedProof('Photo');

    } catch (error) {
      console.error('Error submitting dare:', error);
      toast.error('Failed to send dare. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setCustomChallengeTitle('');
    setCustomChallengeDescription('');
  };

  const handleCustomChallengeSubmit = () => {
    if (!customChallengeTitle || !customChallengeDescription) return;
    
    const customChallenge: Challenge = {
      id: `custom-${Date.now()}`,
      title: customChallengeTitle,
      description: customChallengeDescription,
      level: selectedLevel,
      points: selectedLevel === 'beginner' ? 50 : selectedLevel === 'adventurous' ? 100 : 150,
      total_completions: 0,
      total_votes: 0,
      type: selectedChallengeType
    };

    setSelectedChallenge(customChallenge);
  };

  const handleCancelAttempt = () => {
    setShowCancelConfirmation(true);
    setCancelMessage(cancelMessages[Math.floor(Math.random() * cancelMessages.length)]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#cc0000]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#aa0000]">
      <div className="max-w-4xl mx-auto">
        <Header variant="default" />
        <div className="bg-white rounded-t-3xl p-5">
          <Tabs defaultValue="post" className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="post" className="flex-1">Post Date</TabsTrigger>
              <TabsTrigger value="challenge" className="flex-1">Challenge</TabsTrigger>
            </TabsList>

            <TabsContent value="post" className="space-y-6">
              {/* Upload Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#aa0000] mb-4">Share Your Date Experience</h3>
                
                {/* Upload Area */}
                <label className="block border-2 border-dashed border-[#aa0000] rounded-lg p-6 text-center cursor-pointer hover:bg-red-50 transition-colors mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Camera className="w-12 h-12 text-[#aa0000] mx-auto mb-2" />
                  <p className="text-gray-600">Add photos/videos of your date</p>
                </label>

                {/* Preview */}
                {previewUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Title instead of Caption */}
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Give your date a title..."
                  className="w-full p-3 border border-gray-200 rounded-lg mb-4 font-bold text-lg"
                />

                {/* Venue Selector */}
                <div className="mb-4">
                  <VenueSelector
                    venues={VENUES}
                    onVenueSelect={handleVenueSelect}
                    selectedVenue={venue}
                  />
                </div>

                {/* Map */}
                {venue && (
                  <div className="mb-4 relative h-48 rounded-lg overflow-hidden">
                    <Map
                      center={mapCenter}
                      zoom={14}
                      markers={[{ coordinates: mapCenter, title: venue }]}
                    />
                    <div className="absolute bottom-2 left-2 bg-white px-3 py-1 rounded-full shadow-md flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#aa0000]" />
                      <span className="text-sm font-medium">{venue}</span>
                    </div>
                  </div>
                )}

                {/* Date Partner Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Who did you go on a date with?</h4>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for your date partner..."
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setDatePartner(user);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              <ProfileImage user={user} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{user.first_name} {user.last_name}</div>
                              <div className="text-sm text-gray-500">{user.age} years old</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {datePartner && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <ProfileImage user={datePartner} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium">{datePartner.first_name} {datePartner.last_name}</div>
                          <div className="text-sm text-gray-500">{datePartner.age} years old</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDatePartner(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Ratings Section */}
                <div className="space-y-6 mb-6">
                  {/* Venue Rating */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Rate the Venue</h4>
                    <div className="flex gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer ${
                            star <= ratings.venue_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                          onClick={() => setRatings({ ...ratings, venue_rating: star })}
                        />
                      ))}
                    </div>
                    <textarea
                      value={ratings.venue_review}
                      onChange={(e) => setRatings({ ...ratings, venue_review: e.target.value })}
                      placeholder="How was the venue?"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Overall Date Rating */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Rate the Overall Date</h4>
                    <div className="flex gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer ${
                            star <= ratings.date_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                          onClick={() => setRatings({ ...ratings, date_rating: star })}
                        />
                      ))}
                    </div>
                    <textarea
                      value={ratings.date_review}
                      onChange={(e) => setRatings({ ...ratings, date_review: e.target.value })}
                      placeholder="How was the date overall?"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Date Partner Rating */}
                  {datePartner && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Rate Your Date Partner</h4>
                      <div className="flex gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 cursor-pointer ${
                              star <= ratings.date_partner_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            onClick={() => setRatings({ ...ratings, date_partner_rating: star })}
                          />
                        ))}
                      </div>
                      <textarea
                        value={ratings.date_partner_review}
                        onChange={(e) => setRatings({ ...ratings, date_partner_review: e.target.value })}
                        placeholder="How was your date partner?"
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none"
                        rows={2}
                      />
                    </div>
                  )}
                </div>

                {/* Group Selection */}
                {visibility === 'groups' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Select Groups</h4>
                    <div className="space-y-2">
                      {userGroups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group.id]);
                              } else {
                                setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#aa0000] focus:ring-[#aa0000]"
                          />
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm text-gray-500">{group.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !selectedImage || !venue}
                  className="w-full bg-[#aa0000] text-white py-3 rounded-full font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Posting...' : 'POST TO COMMUNITY'}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="challenge" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-2xl font-bold text-[#aa0000] mb-6">Create a Date Challenge</h3>

                {/* Challenge Type Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    onClick={() => setSelectedChallengeType('date_invite')}
                    className={`py-4 px-6 rounded-lg text-center font-semibold transition-colors ${
                      selectedChallengeType === 'date_invite'
                        ? 'bg-[#aa0000] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Dare to Date
                  </button>
                  <button
                    onClick={() => setSelectedChallengeType('date_activity')}
                    className={`py-4 px-6 rounded-lg text-center font-semibold transition-colors ${
                      selectedChallengeType === 'date_activity'
                        ? 'bg-[#aa0000] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Date Activity
                  </button>
                </div>

                {/* Warning Banner */}
                <div className="bg-[#ffeeee] border-2 border-[#aa0000] rounded-lg p-4 mb-6">
                  <h4 className="font-bold text-[#aa0000] mb-2">⚠️ No Backing Out!</h4>
                  <p className="text-sm text-gray-700">
                    Once you accept a challenge, canceling or rescheduling will result in:
                    <br />• Penalty dares assigned by friends/Ophelia
                    <br />• Decreased rating and status
                    <br />• Public shaming on the "Biggest Bailers" leaderboard
                    <br />• Surprise challenges on your next date
                    <br />• Possible financial penalties
                  </p>
                </div>

                {/* User Search Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Who do you want to dare?
                  </h4>
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={dareUserSearch}
                      onChange={(e) => setDareUserSearch(e.target.value)}
                      placeholder="Search for a user..."
                      className="w-full p-4 border border-gray-200 rounded-lg"
                    />
                  </div>

                  {/* User Grid */}
                  {dareUserResults.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-6">
                      {dareUserResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedDareUser(user);
                            setDareUserSearch('');
                            setDareUserResults([]);
                          }}
                          className={`text-center transition-all ${
                            selectedDareUser?.id === user.id ? 'transform scale-105' : ''
                          }`}
                        >
                          <div className={`w-16 h-16 mx-auto rounded-full overflow-hidden border-2 ${
                            selectedDareUser?.id === user.id ? 'border-[#aa0000]' : 'border-transparent'
                          }`}>
                            <ProfileImage user={user} className="w-full h-full object-cover" />
                          </div>
                          <div className="mt-2 text-sm font-medium text-gray-700">{user.first_name}</div>
                          <div className="text-xs text-gray-500">{user.age} y/o</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDareUser && (
                    <div className="bg-white p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <ProfileImage user={selectedDareUser} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedDareUser.first_name}</div>
                          <div className="text-sm text-gray-500">{selectedDareUser.age} years old</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDareUser(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Challenge Options */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {selectedChallengeType === 'date_invite' ? 'Select a Venue Challenge' : 'Select a Date Activity'}
                    </h4>
                    {selectedChallengeType === 'date_invite' && (
                      <button
                        onClick={() => setChallenges([...venueDares].sort(() => Math.random() - 0.5).slice(0, 4))}
                        className="text-[#aa0000] hover:text-[#990000] text-sm font-medium"
                      >
                        🔄 Refresh Suggestions
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challenges.map((challenge) => (
                      <button
                        key={challenge.id}
                        onClick={() => handleChallengeSelect(challenge)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedChallenge?.id === challenge.id
                            ? 'border-[#aa0000] bg-[#ffeeee]'
                            : 'border-gray-200 hover:border-[#aa0000] hover:transform hover:scale-[1.02]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-[#aa0000]">{challenge.title}</h3>
                          <span className="bg-[#ffeeee] text-[#aa0000] px-2 py-1 rounded-full text-sm">
                            {challenge.points} pts
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{challenge.description}</p>
                        {challenge.venue && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {challenge.venue}
                          </div>
                        )}
                        {challenge.penalty && (
                          <div className="mt-2 text-sm text-[#aa0000]">
                            Penalty: {challenge.penalty.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline Section with Stricter Messaging */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Set a STRICT deadline</h4>
                  <p className="text-sm text-[#aa0000] mb-4">
                    ⚠️ Missing this deadline = Automatic penalty. Choose wisely.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['24 hours', '48 hours', '3 days', 'This weekend', '1 week'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedDeadline(time)}
                        className={`px-4 py-2 rounded-full border-2 transition-colors ${
                          selectedDeadline === time
                            ? 'border-[#aa0000] bg-[#aa0000] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-[#aa0000]'
                        } text-sm font-medium`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancel Confirmation Modal */}
                {showCancelConfirmation && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                      <h4 className="text-xl font-bold text-[#aa0000] mb-4">{cancelMessage}</h4>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowCancelConfirmation(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Stay Strong
                        </button>
                        <button
                          onClick={() => {
                            // Handle the actual cancellation with penalties
                            setShowCancelConfirmation(false);
                            // Add penalty logic here
                          }}
                          className="px-4 py-2 bg-[#aa0000] text-white rounded-lg hover:bg-[#990000]"
                        >
                          Accept Consequences
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Challenge */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Or create your own challenge
                  </h4>
                  <input
                    type="text"
                    value={customChallengeTitle}
                    onChange={(e) => setCustomChallengeTitle(e.target.value)}
                    placeholder="Give your challenge a catchy title"
                    className="w-full p-4 border border-gray-200 rounded-lg mb-4"
                  />
                  <textarea
                    value={customChallengeDescription}
                    onChange={(e) => setCustomChallengeDescription(e.target.value)}
                    placeholder="Describe your challenge in detail... Be bold!"
                    className="w-full p-4 border border-gray-200 rounded-lg resize-none"
                    rows={4}
                  />
                  {customChallengeTitle && customChallengeDescription && (
                    <button
                      onClick={handleCustomChallengeSubmit}
                      className="w-full mt-4 py-3 bg-[#aa0000] text-white rounded-lg font-semibold hover:bg-[#990000] transition-colors"
                    >
                      Create Custom Challenge
                    </button>
                  )}
                </div>

                {/* Preview Section */}
                {selectedDareUser && selectedChallenge && (
                  <div className="bg-white rounded-lg p-6 border-2 border-[#aa0000] mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Challenge Preview</h4>
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        You are daring <strong>{selectedDareUser.first_name}</strong> to complete:
                      </p>
                      <div>
                        <h5 className="font-bold text-[#aa0000]">{selectedChallenge.title}</h5>
                        <p className="text-gray-600">{selectedChallenge.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">Deadline:</span>
                        <span className="text-gray-600">{selectedDeadline}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">Proof required:</span>
                        <span className="text-gray-600">{selectedProof}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">Points:</span>
                        <span className="text-gray-600">{selectedChallenge.points} pts</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDareSubmit(selectedChallenge!)}
                  disabled={!selectedDareUser || !selectedChallenge}
                  className="w-full py-4 bg-[#aa0000] text-white rounded-lg font-semibold hover:bg-[#990000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Challenge
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
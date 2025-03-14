'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Map from '@/components/Map';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Star, MapPin, Clock, Settings, Trash2, Users, Search } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import GroupPhotoUpload from '@/components/GroupPhotoUpload';
import Image from 'next/image';
import Link from 'next/link';

interface DateLocation {
  id: string;
  venue_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  review: {
    venue_review: string;
    date_review: string;
    venue_rating: number;
    date_rating: number;
  };
}

interface GroupMember {
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  lastDate?: DateLocation;
}

interface DatabaseInvite {
  id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

interface SupabaseInvite {
  id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

interface PendingInvite {
  id: string;
  invitee: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupPhotoUrl, setGroupPhotoUrl] = useState<string | null>(null);
  const [dateLocations, setDateLocations] = useState<DateLocation[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<DateLocation | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    first_name: string;
    avatar_url: string | null;
  }[]>([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const { data: group } = await supabase
          .from('groups')
          .select('name, group_photo_url')
          .eq('id', params.id)
          .single();

        if (group) {
          setGroupName(group.name);
          setGroupPhotoUrl(group.group_photo_url);
        }

        // Fetch group members and their last dates
        const { data: membersData } = await supabase
          .from('group_members')
          .select(`
            user:profiles!inner(
              id,
              first_name,
              avatar_url
            )
          `)
          .eq('group_id', params.id);

        if (membersData) {
          const members = membersData.map((m: any) => ({
            user: m.user
          }));

          // Fetch date locations for all members
          const { data: locations } = await supabase
            .from('date_locations')
            .select(`
              id,
              venue_name,
              latitude,
              longitude,
              created_at,
              user:profiles!inner(
                id,
                first_name,
                avatar_url
              ),
              review:user_challenges!inner(
                venue_review,
                date_review,
                venue_rating,
                date_rating
              )
            `)
            .eq('group_id', params.id)
            .order('created_at', { ascending: false });

          if (locations) {
            const formattedLocations = locations.map(loc => ({
              ...loc,
              user: loc.user?.[0] || null,
              review: loc.review?.[0] || null
            }));
            setDateLocations(formattedLocations);
            
            // Update members with their last dates
            const updatedMembers = members.map(member => {
              const lastDate = formattedLocations.find(loc => loc.user?.id === member.user?.id);
              return {
                ...member,
                lastDate
              };
            });
            setMembers(updatedMembers);
          } else {
            setMembers(members);
          }
        }

        // Fetch pending invites
        const { data: invitesData } = await supabase
          .from('group_invites')
          .select(`
            id,
            created_at,
            profiles!group_invites_invitee_id_fkey (
              id,
              first_name,
              avatar_url
            )
          `)
          .eq('group_id', params.id)
          .eq('status', 'pending') as { data: SupabaseInvite[] | null };

        if (invitesData) {
          setPendingInvites(invitesData.map(invite => ({
            id: invite.id,
            created_at: invite.created_at,
            invitee: {
              id: invite.profiles.id,
              first_name: invite.profiles.first_name,
              avatar_url: invite.profiles.avatar_url
            }
          })));
        }

        // Check if current user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: memberRole } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', params.id)
            .eq('user_id', user.id)
            .single();

          setIsAdmin(memberRole?.role === 'admin');
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [params.id]);

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: newGroupName.trim() })
        .eq('id', params.id);

      if (error) throw error;
      setGroupName(newGroupName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating group name:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin || !confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      router.push('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, avatar_url')
        .ilike('first_name', `%${query}%`)
        .neq('id', user.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('group_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (error) {
      console.error('Error canceling invite:', error);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!isAdmin) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the current user's profile
      const { data: currentUserProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;

      // Get the invitee's profile data including email
      const { data: inviteeData, error: inviteeError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (inviteeError) throw inviteeError;

      // Create the invite
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .insert({
          group_id: params.id,
          inviter_id: user.id,
          invitee_id: userId,
          status: 'pending'
        })
        .select(`
          id,
          created_at,
          invitee:profiles!group_invites_invitee_id_fkey (
            id,
            first_name,
            avatar_url,
            email
          )
        `)
        .single();

      if (inviteError) throw inviteError;

      // Add the new invite to the state
      setPendingInvites(prev => [...prev, {
        id: invite.id,
        created_at: invite.created_at,
        invitee: {
          id: invite.invitee[0].id,
          first_name: invite.invitee[0].first_name,
          avatar_url: invite.invitee[0].avatar_url
        }
      }]);

      try {
        // Try to send email notification
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: invite.invitee[0].email,
            templateId: process.env.Sendgrid_group_invite_template_id || 'd-4c10bbe78a694fd5be7c3f1b3b4993e6',
            dynamicTemplateData: {
              first_name: invite.invitee[0].first_name,
              group_name: groupName,
              inviter_name: currentUserProfile.first_name,
              join_url: `${window.location.origin}/groups/join/${params.id}`
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to send email notification:', errorData);
        }
      } catch (emailError) {
        console.warn('Failed to send email notification, but invite was created successfully:', emailError);
      }

      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#aa0000] pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="default" />
        
        {/* New Group Header Section */}
        <div className="flex flex-col items-center justify-center mt-8 mb-12">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white mb-4">
            <Image
              src={groupPhotoUrl || '/images/default-group-photo.png'}
              alt={groupName || 'Group photo'}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{groupName}</h1>
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="w-full bg-[#cc0000] rounded-lg p-1 flex border-2 border-white">
            <TabsTrigger value="map" className="flex-1 text-white data-[state=active]:bg-white data-[state=active]:text-[#cc0000]">Map View</TabsTrigger>
            <TabsTrigger value="members" className="flex-1 text-white data-[state=active]:bg-white data-[state=active]:text-[#cc0000]">Members</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-white data-[state=active]:bg-white data-[state=active]:text-[#cc0000]">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            {/* Map Container */}
            <div className="w-full h-[400px] rounded-xl overflow-hidden">
              <Map
                center={[-71.0589, 42.3601]}
                zoom={12}
                markers={dateLocations.map(loc => ({
                  coordinates: [loc.longitude, loc.latitude],
                  title: loc.venue_name
                }))}
              />
            </div>

            {/* Recent Dates List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Recent Dates</h2>
              {dateLocations.map((location) => (
                <Card key={location.id} className="p-4 bg-[#aa0000]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <ProfileImage user={location.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{location.user.first_name}</span>
                        <span className="text-sm text-white/70">
                          {new Date(location.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        {location.venue_name}
                      </div>
                      {location.review && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-white" />
                            <span className="text-sm text-white">Venue Rating: {location.review.venue_rating}/5</span>
                          </div>
                          <p className="text-sm text-white/70">{location.review.venue_review}</p>
                          <p className="text-sm text-white/70 mt-2">{location.review.date_review}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members">
            {/* Members List */}
            <div className="bg-[#aa0000] rounded-lg border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-white" />
                  <h2 className="text-xl font-semibold text-white">Members</h2>
                </div>
              </div>

              {/* Search Users */}
              {isAdmin && (
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search users to invite..."
                      className="w-full px-4 py-2 pl-10 rounded-lg border border-white/20 bg-[#990000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-[#990000] rounded-lg border border-white/20 shadow-sm overflow-hidden">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleInviteUser(user.id)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#880000] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                            <ProfileImage user={user} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-white">{user.first_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {members.map((member) => (
                  <Link href={`/profile/${member.user?.id}`} key={member.user?.id}>
                    <Card className="p-4 bg-white hover:bg-white/90 transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <ProfileImage user={member.user} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium mb-2 text-[#cc0000]">{member.user?.first_name}</h3>
                          {member.lastDate ? (
                            <div className="text-sm text-[#cc0000]/70">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-[#cc0000]" />
                                <span>Last Date: {new Date(member.lastDate.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#cc0000]" />
                                <span>{member.lastDate.venue_name}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-[#cc0000]/50">No dates yet</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Invited Members Section */}
              {pendingInvites.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Invited Members</h3>
                  <div className="space-y-4">
                    {pendingInvites.map((invite) => (
                      <Card key={invite.id} className="p-4 bg-white">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            <ProfileImage user={invite.invitee} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium mb-1 text-[#cc0000]">{invite.invitee?.first_name}</h3>
                            <p className="text-sm text-[#cc0000]/70">
                              Invited {new Date(invite.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-[#cc0000] mt-1">Pending</p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="text-[#cc0000]/70 hover:text-[#cc0000] transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <Card className="p-6 bg-[#aa0000]">
                <h2 className="text-xl font-semibold text-white mb-6">Group Settings</h2>
                
                <div className="space-y-6">
                  {/* Group Photo */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-4">
                      Group Photo
                    </label>
                    <GroupPhotoUpload
                      groupId={params.id as string}
                      currentPhotoUrl={groupPhotoUrl}
                      isAdmin={isAdmin}
                      onPhotoUpdate={(url) => setGroupPhotoUrl(url)}
                    />
                  </div>

                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Group Name
                    </label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-[#cc0000] bg-white rounded-lg text-[#cc0000] placeholder-[#cc0000]/50 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                          placeholder="Enter group name"
                        />
                        <button
                          onClick={handleUpdateGroupName}
                          className="px-4 py-2 bg-white text-[#cc0000] rounded-lg hover:bg-white/90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setNewGroupName(groupName);
                          }}
                          className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-[#990000] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-white">{groupName}</p>
                        <button
                          onClick={() => {
                            setNewGroupName(groupName);
                            setIsEditing(true);
                          }}
                          className="text-white hover:text-white/80 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delete Group */}
                  <div className="pt-6 border-t border-white/20">
                    <h3 className="text-lg font-medium text-white mb-2">Danger Zone</h3>
                    <p className="text-sm text-white/70 mb-4">
                      Once you delete a group, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteGroup}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#cc0000] text-white rounded-full hover:bg-[#990000] transition-colors w-fit text-sm border border-white"
                    >
                      <Trash2 size={16} />
                      <span>Delete Group</span>
                    </button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
} 
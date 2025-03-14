'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Settings, Users, Trash2 } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';

interface GroupMember {
  id: string;
  first_name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
}

interface PendingInvite {
  id: string;
  invitee: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface DatabaseMember {
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
  role: 'admin' | 'member';
}

interface DatabaseInvite {
  id: string;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  };
}

export default function GroupSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchGroupData();
  }, [params.id]);

  const fetchGroupData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', params.id)
        .single();

      if (groupData) {
        setGroup({ id: params.id, name: groupData.name, created_at: '' });
        setNewGroupName(groupData.name);
      }

      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from('group_members')
        .select(`
          profiles (
            id,
            first_name,
            avatar_url
          ),
          role
        `)
        .eq('group_id', params.id);

      // Fetch pending invites
      const { data: invitesData } = await supabase
        .from('group_invites')
        .select(`
          id,
          profiles!group_invites_invitee_id_fkey (
            id,
            first_name,
            avatar_url
          )
        `)
        .eq('group_id', params.id)
        .eq('status', 'pending');

      if (membersData) {
        const formattedMembers = (membersData as unknown as DatabaseMember[]).map(member => ({
          id: member.profiles.id,
          first_name: member.profiles.first_name,
          avatar_url: member.profiles.avatar_url,
          role: member.role
        }));

        setMembers(formattedMembers);
        setIsAdmin(formattedMembers.some(m => m.id === user.id && m.role === 'admin'));
      }

      if (invitesData) {
        const formattedInvites = (invitesData as unknown as DatabaseInvite[]).map(invite => ({
          id: invite.id,
          invitee: {
            id: invite.profiles.id,
            first_name: invite.profiles.first_name,
            avatar_url: invite.profiles.avatar_url
          }
        }));

        setPendingInvites(formattedInvites);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', params.id)
        .eq('user_id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
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

  const handleUpdateGroupName = async () => {
    if (!isAdmin || !group) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: newGroupName })
        .eq('id', group.id);

      if (error) throw error;
      setGroup({ ...group, name: newGroupName });
    } catch (error) {
      console.error('Error updating group name:', error);
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

      setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
    } catch (error) {
      console.error('Error canceling invite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-5">
          <Header variant="matching" />
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Group not found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="matching" />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#BA2525]">Group Settings</h1>
          </div>

          {/* Group Info Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              {isEditing ? (
                <div className="flex-1">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA2525]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleUpdateGroupName}
                      className="px-4 py-1 bg-[#BA2525] text-white rounded-full text-sm hover:bg-[#990000] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNewGroupName(group?.name || '');
                      }}
                      className="px-4 py-1 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{group?.name}</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[#BA2525] hover:text-[#990000]"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              Created {group?.created_at ? new Date(group.created_at).toLocaleDateString() : ''}
            </p>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Members</h2>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <ProfileImage user={member} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{member.first_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {isAdmin && member.id !== (supabase.auth.getUser() as any).data?.user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invited Members Section */}
          {pendingInvites.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Invited Members</h2>
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <ProfileImage user={invite.invitee} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium">{invite.invitee.first_name}</p>
                        <p className="text-sm text-gray-500">Pending Invitation</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
              <button
                onClick={handleDeleteGroup}
                className="w-full p-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
              >
                Delete Group
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 
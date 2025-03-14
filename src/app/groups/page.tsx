'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import GroupCard from '@/components/GroupCard';
import { Plus, UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isAdmin: boolean;
  group_photo_url: string | null;
}

interface GroupInvite {
  id: string;
  group: {
    id: string;
    name: string;
  };
  inviter: {
    first_name: string;
  };
}

interface DatabaseMembership {
  group_id: string;
  role: string;
  groups: {
    id: string;
    name: string;
    description: string;
    group_photo_url: string | null;
  };
}

interface DatabaseInvite {
  id: string;
  groups: {
    id: string;
    name: string;
  };
  profiles: {
    first_name: string;
  };
}

export default function GroupsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Fetch groups the user is a member of
        const { data: memberships, error: membershipError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            groups!inner (
              id,
              name,
              description,
              group_photo_url
            )
          `)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (membershipError) throw membershipError;

        // Fetch member counts for each group
        const groupsWithCounts = await Promise.all(
          (memberships as unknown as DatabaseMembership[]).map(async (membership) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact' })
              .eq('group_id', membership.group_id);

            return {
              id: membership.groups.id,
              name: membership.groups.name,
              description: membership.groups.description,
              group_photo_url: membership.groups.group_photo_url,
              memberCount: count || 0,
              isAdmin: membership.role === 'admin'
            };
          })
        );

        setGroups(groupsWithCounts);

        // Fetch pending invites
        const { data: pendingInvites, error: invitesError } = await supabase
          .from('group_invites')
          .select(`
            id,
            groups!inner (
              id,
              name
            ),
            profiles!group_invites_inviter_id_fkey!inner (
              first_name
            )
          `)
          .eq('invitee_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'pending');

        if (invitesError) throw invitesError;

        setInvites((pendingInvites as unknown as DatabaseInvite[]).map(invite => ({
          id: invite.id,
          group: {
            id: invite.groups.id,
            name: invite.groups.name
          },
          inviter: {
            first_name: invite.profiles.first_name
          }
        })));

      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      if (accept) {
        const invite = invites.find(i => i.id === inviteId);
        if (invite) {
          // Add user to group members
          await supabase
            .from('group_members')
            .insert({
              group_id: invite.group.id,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              role: 'member'
            });
        }
      }

      // Remove invite from list
      setInvites(invites.filter(i => i.id !== inviteId));

      // Refresh groups if accepted
      if (accept) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error handling invite:', error);
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
        
        <div className="mt-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">My Groups</h1>
            <button
              onClick={() => router.push('/groups/create')}
              className="flex items-center gap-2 bg-white text-[#aa0000] px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors text-sm"
            >
              <Plus size={16} />
              <span>Create Group</span>
            </button>
          </div>
          
          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Pending Invites</h2>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="bg-white rounded-lg shadow-sm border border-white/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#aa0000]">
                          <span className="font-medium">{invite.inviter.first_name}</span> invited you to join
                          <span className="font-medium"> {invite.group.name}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInviteResponse(invite.id, true)}
                          className="px-3 py-1 bg-[#aa0000] text-white rounded-full text-sm hover:bg-[#990000] transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite.id, false)}
                          className="px-3 py-1 border border-[#aa0000] text-[#aa0000] rounded-full text-sm hover:bg-[#aa0000]/5 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups List */}
          {groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <UserPlus size={48} className="text-[#aa0000] mx-auto mb-4" />
              <h3 className="text-xl font-medium text-[#aa0000] mb-2">No Groups Yet</h3>
              <p className="text-[#aa0000]/80 mb-6">Create a group or accept an invite to get started</p>
              <button
                onClick={() => router.push('/groups/create')}
                className="bg-[#aa0000] text-white px-6 py-2 rounded-full hover:bg-[#990000] transition-colors"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 
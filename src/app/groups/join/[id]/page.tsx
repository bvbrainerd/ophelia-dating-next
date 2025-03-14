'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface GroupInvite {
  id: string;
  status: string;
  inviter: {
    id: string;
    first_name: string;
  };
}

interface DatabaseInvite {
  id: string;
  status: string;
  groups: Group;
  inviter: {
    id: string;
    first_name: string;
  };
}

export default function JoinGroupPage() {
  const router = useRouter();
  const params = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch group and invite details
        const { data: inviteData, error: inviteError } = await supabase
          .from('group_invites')
          .select(`
            id,
            status,
            groups!inner (
              id,
              name,
              created_at
            ),
            inviter:profiles!group_invites_inviter_id_fkey (
              id,
              first_name
            )
          `)
          .eq('group_id', params.id)
          .eq('invitee_id', user.id)
          .eq('status', 'pending')
          .single();

        if (inviteError) throw inviteError;
        if (!inviteData) {
          setError('Invite not found or already accepted');
          setIsLoading(false);
          return;
        }

        // Cast the data with the correct shape
        const typedInviteData = {
          id: inviteData.id,
          status: inviteData.status,
          groups: inviteData.groups[0],
          inviter: inviteData.inviter[0]
        } as DatabaseInvite;
        
        setGroup(typedInviteData.groups);
        setInvite({
          id: typedInviteData.id,
          status: typedInviteData.status,
          inviter: typedInviteData.inviter
        });
      } catch (error) {
        console.error('Error fetching invite data:', error);
        setError('Failed to load invite data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInviteData();
  }, [params.id, router]);

  const handleJoinGroup = async () => {
    if (!group || !invite) return;

    try {
      // Start a transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Add user to group members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update invite status
      const { error: inviteError } = await supabase
        .from('group_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (inviteError) throw inviteError;

      // Redirect to group page
      router.push(`/groups/${group.id}`);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BA2525]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-5">
          <Header variant="matching" />
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <button
              onClick={() => router.push('/groups')}
              className="px-4 py-2 bg-[#BA2525] text-white rounded-full hover:bg-[#990000] transition-colors"
            >
              Go to Groups
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="matching" />
        
        <div className="mt-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-[#BA2525]" />
              <h1 className="text-2xl font-bold text-gray-900">Join Group</h1>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#BA2525] mb-2">{group?.name}</h2>
                <p className="text-gray-600">
                  Invited by {invite?.inviter.first_name}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleJoinGroup}
                  className="flex-1 p-2.5 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#990000] transition-colors"
                >
                  Join Group
                </button>
                <button
                  onClick={() => router.push('/groups')}
                  className="flex-1 p-2.5 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 
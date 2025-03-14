'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Search, Plus, X } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';

interface User {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name: groupName })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: creatorError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

      if (creatorError) throw creatorError;

      // Add selected users as members
      const memberPromises = selectedUsers.map(selectedUser =>
        supabase
          .from('group_invites')
          .insert({
            group_id: group.id,
            inviter_id: user.id,
            invitee_id: selectedUser.id
          })
      );

      await Promise.all(memberPromises);
      router.push('/groups');
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto p-5">
        <Header variant="matching" />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-[#BA2525] mb-8">Create New Group</h1>
          
          <div className="space-y-6">
            {/* Group Name Input */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BA2525] focus:border-transparent"
                placeholder="Enter group name"
              />
            </div>

            {/* User Search */}
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Add Members
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="userSearch"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BA2525] focus:border-transparent"
                  placeholder="Search users by name"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                        <ProfileImage user={user} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-gray-900">{user.first_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <ProfileImage user={user} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm text-gray-900">{user.first_name}</span>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || isLoading}
              className="w-full bg-[#BA2525] text-white py-2 rounded-[20px] font-medium hover:bg-[#990000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
} 
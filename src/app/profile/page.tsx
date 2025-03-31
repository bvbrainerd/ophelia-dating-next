import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prompt } from '@/app/fonts';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import ProfileImage from '@/components/ProfileImage';

interface Venue {
  name: string;
}

interface Profile {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

interface Post {
  id: string;
  venue: string;
  created_at: string;
  proof_media_url: string | null;
  status: string;
  venues: Venue;
  profiles: Profile;
}

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user's posts
  const { data: posts } = await supabase
    .from('date_requests')
    .select(`
      id,
      venue,
      created_at,
      proof_media_url,
      status,
      venues!inner (
        name
      ),
      profiles!date_requests_sender_id_fkey (
        id,
        first_name,
        avatar_url
      )
    `)
    .eq('sender_id', user.id)
    .in('status', ['completed', 'rated'])
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  // Transform posts to include proper image URLs
  const transformedPosts = (posts || []).map(post => {
    let proofUrl = post.proof_media_url;
    if (proofUrl && !proofUrl.startsWith('http')) {
      const { data } = supabase.storage
        .from('date-proofs')
        .getPublicUrl(proofUrl.replace(/^date-proofs\//, ''));
      proofUrl = data?.publicUrl;
    }
    return {
      ...post,
      proof_media_url: proofUrl,
      venues: post.venues[0] || { name: 'Unknown Venue' }, // Ensure single venue object
      profiles: post.profiles[0] || { id: '', first_name: '', avatar_url: null } // Ensure single profile object
    } as Post;
  });

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Ophelia Header */}
      <div className="bg-[#cc0000] text-white py-4 px-6 flex items-center justify-center">
        <h1 className={`text-3xl font-bold ${prompt.className}`}>Ophelia</h1>
      </div>

      {/* Profile Header */}
      <div className="p-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#cc0000]">
          <ProfileImage user={profile} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold text-[#202020] ${prompt.className}`}>{profile?.first_name}</h1>
          <p className={`text-gray-600 ${prompt.className}`}>
            {transformedPosts.length || 0} {transformedPosts.length === 1 ? 'date' : 'dates'}
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1">
        {transformedPosts.map((post) => (
          <Link 
            href={`/dashboard?post=${post.id}`} 
            key={post.id} 
            className="aspect-square relative bg-gray-100 overflow-hidden"
          >
            {post.proof_media_url ? (
              <img 
                src={post.proof_media_url} 
                alt={`Date at ${post.venues.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <span className={`text-gray-500 text-sm ${prompt.className}`}>No photo</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className={`text-sm text-white ${prompt.className}`}>{post.venues.name}</p>
              <p className={`text-xs text-white/60 ${prompt.className}`}>{formatTimeAgo(post.created_at)}</p>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
} 
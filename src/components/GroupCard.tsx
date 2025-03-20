import React from 'react';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    isAdmin: boolean;
    group_photo_url?: string | null;
  };
}

const DEFAULT_GROUP_PHOTO = '/images/default-group-photo.png';

export default function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/groups/${group.id}`)}
      className="bg-white rounded-lg shadow-sm border border-white/20 p-4 cursor-pointer hover:bg-white/95 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={group.group_photo_url || DEFAULT_GROUP_PHOTO}
            alt={`${group.name} group photo`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#aa0000]">{group.name}</h3>
          <p className="text-[#aa0000]/80 text-sm mb-2">{group.description}</p>
          <div className="flex items-center gap-2 text-[#aa0000]/70">
            <Users size={16} />
            <span className="text-sm">{group.memberCount} members</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
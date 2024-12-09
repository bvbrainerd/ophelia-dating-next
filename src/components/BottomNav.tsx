import Link from 'next/link';
import { Home, Users, Calendar, UserCircle, Heart } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-2xl mx-auto flex justify-around">
        {[
          { icon: <Home size={24} />, label: 'Home', href: '/dashboard' },
          { icon: <Users size={24} />, label: 'Matches', href: '/matching' },
          { icon: <Heart size={24} />, label: 'Dates', href: '/daterequests' },
          { icon: <Calendar size={24} />, label: 'Upcoming', href: '/dates/upcoming' },
          { icon: <UserCircle size={24} />, label: 'Profile', href: '/dashboard/editprofile' }
        ].map(({ icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center text-[#BA2525] cursor-pointer hover:opacity-80 transition-opacity"
          >
            {icon}
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

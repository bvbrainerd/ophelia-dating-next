import Link from 'next/link';
import { Home, Users, Calendar, UserCircle, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();

  // Use onClick handlers instead of direct href to prevent auth issues
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-2xl mx-auto flex justify-around">
        {[
          { icon: <Home size={24} />, label: 'Home', path: '/dashboard' },
          { icon: <Users size={24} />, label: 'Matches', path: '/matching' },
          { icon: <Heart size={24} />, label: 'Dates', path: '/daterequests' },
          { icon: <Calendar size={24} />, label: 'Upcoming', path: '/dates/upcoming' },
          { icon: <UserCircle size={24} />, label: 'Profile', path: '/dashboard/editprofile' }
        ].map(({ icon, label, path }) => (
          <button
            key={label}
            onClick={handleNavigation(path)}
            className="flex flex-col items-center text-[#BA2525] cursor-pointer hover:opacity-80 transition-opacity"
          >
            {icon}
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

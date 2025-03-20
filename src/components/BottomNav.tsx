import { useRouter } from 'next/navigation';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';
import { Prompt } from 'next/font/google';

const prompt = Prompt({
  weight: ['400', '700'],
  subsets: ['latin']
});

export default function BottomNav() {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#aa0000] border-t border-white py-1.5 px-3 z-50">
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>HOME</span>
        </button>
        
        <button 
          onClick={() => router.push('/matching')}
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>MATCH</span>
        </button>
        
        <button 
          onClick={() => router.push('/challenges')}
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <PlusCircle className="w-7 h-7" />
          <span className={`text-[10px] ${prompt.className}`}>POST</span>
        </button>
        
        <button 
          onClick={() => router.push('/daterequests')}
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>ALERTS</span>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/editprofile')}
          className="flex flex-col items-center gap-0.5 text-white hover:text-white/80 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className={`text-[10px] ${prompt.className}`}>PROFILE</span>
        </button>
      </div>
    </div>
  );
}

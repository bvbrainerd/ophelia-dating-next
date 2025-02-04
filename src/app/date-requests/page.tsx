import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabase/client';
import { Coffee, Calendar } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import Map from '@/components/Map';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav'; 
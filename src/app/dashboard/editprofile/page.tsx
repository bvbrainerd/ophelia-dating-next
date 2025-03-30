'use client';

import { useEffect, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import WalletComponent from '@/components/WalletComponent';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import Image from 'next/image';
import Link from 'next/link';
import ImageCropper from '@/components/ImageCropper';
import ProfileImageGallery from '@/components/ProfileImageGallery';
import DescriptorBubbles, { Descriptor } from '@/components/DescriptorBubbles';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';

// Initialize Stripe with proper options and rate limiting
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  apiVersion: '2025-02-24.acacia',
  locale: 'en',
  betas: ['elements_customers_session_benchmark_beta_1'] // This helps reduce benchmark requests
});

// Log Stripe initialization
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const DEFAULT_AVATAR = '/images/default-avatar.png';

// Types
interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface WalletPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface ProfileImage {
  id: number;
  profile_id: string;
  image_url: string;
  is_main: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  age: number;
  gender: string;
  preferred_gender: string;
  dater_archetype: string;
  school: string;
  profile_visibility: "public" | "private";
  relationship_status: "single" | "couple";
  partner_id?: string;
  partner_email?: string;
  is_couple_profile: boolean;
  couple_verified: boolean;
  descriptors: Descriptor[];
}

// Update ProfileData interface
interface ProfileData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  age: number | null;
  gender: string;
  preferred_gender: string;
  dater_archetype: string;
  school: string;
  profile_visibility: "public" | "private";
  relationship_status: "single" | "couple";
  partner_id?: string | null;
  partner_email?: string | null;
  is_couple_profile: boolean;
  couple_verified: boolean;
  descriptors: Descriptor[];
  referral_code?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isAdmin: boolean;
  group_photo_url: string | null;
}

// Constants
const SCHOOLS = [
  'Boston College',
  'Harvard',
  'MIT',
  'Northeastern',
  'BU',
  'N/A',
] as const;

const ARCHETYPES = [
  { value: 'hopelessRomantic', label: 'Hopeless Romantic' },
  { value: 'cautiousDater', label: 'Cautious Dater' },
  { value: 'commitmentSeeker', label: 'Commitment Seeker' },
  { value: 'serialDater', label: 'Serial Dater' },
  { value: 'friendsWithBenefits', label: 'Friends with Benefits' },
] as const;

interface SetupFormProps {
  clientSecret: string;
  onClose: () => void;
}

const SetupForm = ({ clientSecret, onClose }: SetupFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      console.log('Stripe or Elements not initialized');
      return;
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      console.error('Stripe not initialized');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-redirect`,
        }
      });

      if (submitError) {
        console.error('Setup confirmation error:', submitError);
        setError(submitError.message || 'An error occurred while setting up your card.');
        return;
      }

      // If we get here, the setup was successful
      onClose();
    } catch (e: any) {
      console.error('Error in handleSubmit:', e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
        
        <form onSubmit={handleSubmit}>
          <PaymentElement />
          
          {error && (
            <div className="mt-4 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || processing}
              className="px-4 py-2 bg-[#cc0000] text-white rounded-md hover:bg-[#aa0000] disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditProfileWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8 pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

interface PaymentSectionProps {
  profileData: ProfileData;
  setProfileData: Dispatch<SetStateAction<ProfileData>>;
  profileImages: ProfileImage[];
  setProfileImages: Dispatch<SetStateAction<ProfileImage[]>>;
  selectedFile: File | null;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  showCropper: boolean;
  setShowCropper: Dispatch<SetStateAction<boolean>>;
  isUploading: boolean;
  setIsUploading: Dispatch<SetStateAction<boolean>>;
  previewUrl: string | null;
  avatarFile: File | null;
  imageError: string | null;
  setImageError: Dispatch<SetStateAction<string | null>>;
}

const PaymentSection = ({
  profileData,
  setProfileData,
  profileImages,
  setProfileImages,
  selectedFile,
  setSelectedFile,
  showCropper,
  setShowCropper,
  isUploading,
  setIsUploading,
  previewUrl,
  avatarFile,
  imageError,
  setImageError
}: PaymentSectionProps) => {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralClicks, setReferralClicks] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    
    // Initialize Stripe with debounce
    const initStripe = async () => {
      try {
        if (!stripeLoaded) {
          await stripePromise;
          if (mounted) {
            setStripeLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        if (mounted) {
          setError('Failed to initialize payment system');
        }
      }
    };

    // Add delay to prevent rapid re-initialization
    const timeoutId = setTimeout(initStripe, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [stripeLoaded]);

  const getCleanAvatarUrl = useCallback(async (url: string | null) => {
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith('http') || url.startsWith('/images/')) return url;
    
    try {
      // Extract just the filename without any path or query parameters
      const filename = url.split('/').pop()?.split('?')[0];
      if (!filename) return DEFAULT_AVATAR;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);
        
      return data?.publicUrl || DEFAULT_AVATAR;
    } catch (err) {
      console.error('Error getting avatar URL:', err);
      return DEFAULT_AVATAR;
    }
  }, []);

  const fetchPaymentMethodsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/payments/list-methods', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const { paymentMethods: methods } = await response.json();
      setPaymentMethods(methods || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setImageError('Failed to load payment methods');
    }
  };

  useEffect(() => {
    fetchPaymentMethodsData();
  }, []);

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy referral link');
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) {
        throw new Error('No email found in user account');
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      // Initialize profile data with default values if null
      const initializedProfileData = {
        ...profileData,
        avatar_url: profileData.avatar_url || DEFAULT_AVATAR,
        relationship_status: profileData.relationship_status || 'single',
        is_couple_profile: profileData.relationship_status === 'couple',
        partner_email: profileData.relationship_status === 'couple' ? profileData.partner_email : null,
        partner_id: profileData.relationship_status === 'couple' ? profileData.partner_id : null,
        gender: profileData.gender || '',
        preferred_gender: profileData.preferred_gender || '',
        dater_archetype: profileData.dater_archetype || '',
        descriptors: profileData.descriptors || [],
        school: profileData.school || '',
        profile_visibility: profileData.profile_visibility || 'public'
      };

      setProfileData(initializedProfileData);

      // Fetch profile images
      const { data: imagesData, error: imagesError } = await supabase
        .from('profile_images')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      // Initialize profile images array even if empty
      setProfileImages(imagesData || []);

      // If there's no avatar_url but there are profile images, use the main image
      if (!profileData.avatar_url && imagesData && imagesData.length > 0) {
        const mainImage = imagesData.find(img => img.is_main);
        if (mainImage) {
          await supabase
            .from('profiles')
            .update({ avatar_url: mainImage.image_url })
            .eq('id', user.id);
          
          setProfileData(prev => ({
            ...prev,
            avatar_url: mainImage.image_url
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      handleError(error instanceof Error ? error.message : 'Failed to load profile');
    }
  }, [router]);

  const handleError = (message: string) => {
    setImageError(message);
    setIsUploading(false);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload the image to storage
      const filename = `${user.id}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      if (!publicUrl) throw new Error('Failed to get public URL for uploaded image');

      // Update existing images to not be main
      if (profileImages.length > 0) {
        await supabase
          .from('profile_images')
          .update({ is_main: false })
          .eq('profile_id', user.id);
      }

      // Insert new image as main
      const { data: imageData, error: insertError } = await supabase
        .from('profile_images')
        .insert({
          profile_id: user.id,
          image_url: publicUrl,
          is_main: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update profile avatar_url
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      // Add new image to images array
      setProfileImages(prev => [imageData, ...prev.map(img => ({ ...img, is_main: false }))]);

      // Close cropper and clean up
      setShowCropper(false);
      setSelectedFile(null);
      toast.success('Profile picture updated successfully');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      handleError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    setProfileData(prev => {
      // For relationship_status, handle the transition properly
      if (field === 'relationship_status') {
        const newStatus = value as 'single' | 'couple';
        const baseUpdate = {
          ...prev,
          relationship_status: newStatus || 'single'
        };

        if (newStatus === 'single') {
          return {
            ...baseUpdate,
            partner_email: null,
            partner_id: null,
            is_couple_profile: false,
            couple_verified: false
          };
        }
        return {
          ...baseUpdate,
          is_couple_profile: true
        };
      }
      
      // For partner_email, update couple-related fields
      if (field === 'partner_email') {
        return {
          ...prev,
          partner_email: value as string | null,
          is_couple_profile: Boolean(value),
          couple_verified: false // Reset verification when partner email changes
        };
      }

      // For select fields, ensure we never set null values
      if (['gender', 'preferred_gender', 'dater_archetype', 'school', 'profile_visibility'].includes(field)) {
        return {
          ...prev,
          [field]: value || ''
        };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanAvatarUrl = profileData.avatar_url || DEFAULT_AVATAR;
      const updatedProfile = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        age: profileData.age || null,
        gender: profileData.gender || '',
        preferred_gender: profileData.preferred_gender || '',
        dater_archetype: profileData.dater_archetype || '',
        school: profileData.school || '',
        descriptors: profileData.descriptors || [],
        avatar_url: cleanAvatarUrl,
        profile_visibility: profileData.profile_visibility || 'public',
        relationship_status: profileData.relationship_status || 'single',
        is_couple_profile: profileData.relationship_status === 'couple',
        partner_email: profileData.relationship_status === 'couple' ? profileData.partner_email : null,
        partner_id: profileData.relationship_status === 'couple' ? profileData.partner_id : null,
        couple_verified: profileData.relationship_status === 'couple' ? profileData.couple_verified : false
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(error.message);
      }

      // If this is a couple profile and partner email is provided, send invitation
      if (profileData.relationship_status === 'couple' && profileData.partner_email) {
        console.log('Sending partner invitation to:', profileData.partner_email);
        
        const response = await fetch('/api/invite-partner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerEmail: profileData.partner_email,
            userId: user.id,
            userName: profileData.first_name
          })
        });

        const responseData = await response.json();
        console.log('Partner invitation response:', responseData);

        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || 'Failed to send partner invitation');
        }
      }

      toast.success('Profile updated successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    const refreshImage = async () => {
      if (profileData.avatar_url && !profileData.avatar_url.startsWith('/images/')) {
        try {
          // If it's already a full URL and starts with http, keep using it
          if (profileData.avatar_url.startsWith('http')) {
            return;
          }

          // Clean up the path and ensure it doesn't have a dashboard prefix
          const cleanPath = profileData.avatar_url
            .replace(/^\/dashboard\//, '')
            .replace(/^avatars\//, '')
            .split('?')[0];

          // Get the public URL from Supabase storage
          const { data } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(cleanPath);

          if (data?.publicUrl) {
            setProfileData(prev => ({
              ...prev,
              avatar_url: data.publicUrl
            }));
          } else {
            console.error('Failed to get public URL for:', cleanPath);
            setProfileData(prev => ({
              ...prev,
              avatar_url: DEFAULT_AVATAR
            }));
          }
        } catch (error) {
          console.error('Error refreshing image:', error);
          setProfileData(prev => ({
            ...prev,
            avatar_url: DEFAULT_AVATAR
          }));
        }
      }
    };

    refreshImage();
  }, [profileData.avatar_url]);

  const handleResetPassword = () => {
    try {
      setIsLoading(true);
      // Just redirect to reset password page
      window.location.replace('/auth/reset-password');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to initiate password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescriptorSelect = async (descriptor: Descriptor) => {
    try {
      // Update local state first for immediate feedback
      const newDescriptors = profileData.descriptors.some(d => d.label === descriptor.label)
        ? profileData.descriptors.filter(d => d.label !== descriptor.label)
        : [...profileData.descriptors, descriptor];

      setProfileData(prev => ({
        ...prev,
        descriptors: newDescriptors
      }));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update Supabase immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ descriptors: newDescriptors })
        .eq('id', user.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error updating descriptors:', error);
      // Revert local state if there was an error
      setProfileData(prev => ({
        ...prev,
        descriptors: profileData.descriptors
      }));
    }
  };

  const handleAddCard = async () => {
    try {
      setIsLoading(true);
      setImageError(null);

      // Get the user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get setup intent
      const response = await fetch('/api/payments/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Setup intent error response:', errorData);
        throw new Error(errorData.error || 'Failed to create setup intent');
      }

      const { clientSecret } = await response.json();
      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      setClientSecret(clientSecret);
      setShowAddCard(true);
    } catch (error: any) {
      console.error('Error in handleAddCard:', error);
      setImageError(error.message || 'Failed to set up payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAddCard = () => {
    setShowAddCard(false);
    setClientSecret(null);
    fetchPaymentMethodsData();
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/payments/remove-method', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }

      await fetchPaymentMethodsData();
    } catch (err) {
      console.error('Error removing payment method:', err);
      setImageError('Failed to remove payment method');
    }
  };

  return (
    <div className="space-y-6">
      {stripeLoaded ? (
        <>
          <WalletComponent
            paymentMethods={paymentMethods}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
          />
          {showAddCard && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SetupForm clientSecret={clientSecret} onClose={handleCloseAddCard} />
            </Elements>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p>Loading payment system...</p>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={`${window.location.origin}/auth/signup?ref=${referralCode}`}
              readOnly
              className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="p-3 bg-[#BA2525] text-white rounded-lg hover:bg-[#a02020] transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Your referral code: <span className="font-mono">{referralCode}</span></span>
            <span>Total clicks: {referralClicks}</span>
          </div>
        </div>
      </div>

      {showAddCard && clientSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
            <Elements stripe={stripePromise} options={{
              clientSecret,
              appearance: { theme: 'stripe' },
              loader: 'auto'
            }}>
              <SetupForm
                clientSecret={clientSecret}
                onClose={handleCloseAddCard}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const GroupsSection = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
  }, []);

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
        (memberships as any[]).map(async (membership) => {
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
      setInvites(pendingInvites || []);

    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

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
              group_id: invite.groups.id,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              role: 'member'
            });
        }
      }

      // Remove invite from list and refresh groups
      setInvites(invites.filter(i => i.id !== inviteId));
      fetchGroups();
    } catch (error) {
      console.error('Error handling invite:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Invites Section */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Invites</h3>
          {invites.map((invite) => (
            <div key={invite.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{invite.groups.name}</p>
                  <p className="text-sm text-gray-500">
                    Invited by {invite.profiles.first_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInviteResponse(invite.id, true)}
                    className="px-4 py-2 bg-[#cc0000] text-white rounded-full text-sm hover:bg-[#aa0000] transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleInviteResponse(invite.id, false)}
                    className="px-4 py-2 border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Groups Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Groups</h3>
          <button
            onClick={() => router.push('/groups/create')}
            className="flex items-center gap-2 text-[#cc0000] hover:text-[#aa0000] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={group.group_photo_url || '/images/default-group-photo.png'}
                    alt={group.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{group.name}</h4>
                  <p className="text-sm text-gray-500">{group.memberCount} members</p>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">You're not a member of any groups yet</p>
              <button
                onClick={() => router.push('/groups/create')}
                className="mt-4 px-6 py-2 bg-[#cc0000] text-white rounded-full text-sm hover:bg-[#aa0000] transition-colors"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditProfilePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: DEFAULT_AVATAR,
    bio: '',
    age: null,
    gender: '',
    preferred_gender: '',
    dater_archetype: '',
    school: '',
    descriptors: [],
    profile_visibility: 'public',
    relationship_status: 'single',
    is_couple_profile: false,
    couple_verified: false,
    partner_id: null,
    partner_email: null
  });
  const [imageKey, setImageKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImages, setProfileImages] = useState<ProfileImage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const handleError = (message: string) => {
    setError(message);
    setIsUploading(false);
  };

  const handleCropperClose = () => {
      setShowCropper(false);
      setSelectedFile(null);
      setError(null);
  };

  const handleImageError = (message: string) => {
    setImageError(message);
  };

  const handlePaymentError = (message: string) => {
    setError(message);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) {
        throw new Error('No email found in user account');
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      // Initialize profile data with default values if null
      const initializedProfileData = {
        ...profileData,
        avatar_url: profileData.avatar_url || DEFAULT_AVATAR,
        relationship_status: profileData.relationship_status || 'single',
        is_couple_profile: profileData.relationship_status === 'couple',
        partner_email: profileData.relationship_status === 'couple' ? profileData.partner_email : null,
        partner_id: profileData.relationship_status === 'couple' ? profileData.partner_id : null,
        gender: profileData.gender || '',
        preferred_gender: profileData.preferred_gender || '',
        dater_archetype: profileData.dater_archetype || '',
        descriptors: profileData.descriptors || [],
        school: profileData.school || '',
        profile_visibility: profileData.profile_visibility || 'public'
      };

      setProfileData(initializedProfileData);

      // Fetch profile images
      const { data: imagesData, error: imagesError } = await supabase
        .from('profile_images')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      // Initialize profile images array even if empty
      setProfileImages(imagesData || []);

      // If there's no avatar_url but there are profile images, use the main image
      if (!profileData.avatar_url && imagesData && imagesData.length > 0) {
        const mainImage = imagesData.find(img => img.is_main);
        if (mainImage) {
          await supabase
            .from('profiles')
            .update({ avatar_url: mainImage.image_url })
            .eq('id', user.id);
          
          setProfileData(prev => ({
            ...prev,
            avatar_url: mainImage.image_url
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      handleError(error instanceof Error ? error.message : 'Failed to load profile');
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show the image cropper instead of uploading directly
    setSelectedFile(file);
    setShowCropper(true);
  };

  const extractFilenameFromUrl = (url: string) => {
    // Extract filename from signed URL
    const match = url.match(/\/avatars\/([^?]+)/);
    return match ? match[1] : null;
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const targetImage = profileImages.find(img => img.id === imageId);
      if (!targetImage) throw new Error('Image not found');

      await supabase
        .from('profile_images')
        .update({ is_main: false })
        .eq('profile_id', user.id);

      await supabase
        .from('profile_images')
        .update({ is_main: true })
        .eq('id', imageId);

      await supabase
        .from('profiles')
        .update({ avatar_url: targetImage.image_url })
        .eq('id', user.id);

      await fetchProfile();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const image = profileImages.find(img => img.id === imageId);
      if (!image) return;

      await supabase
        .from('profile_images')
        .delete()
        .eq('id', imageId);

      if (image.is_main) {
        const remainingImages = profileImages.filter(img => img.id !== imageId);
        const newMainImage = remainingImages[0];
        
        await supabase
          .from('profiles')
          .update({ avatar_url: newMainImage?.image_url || null })
          .eq('id', user.id);
      }

      await fetchProfile();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload the image to storage
      const filename = `${user.id}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      if (!publicUrl) throw new Error('Failed to get public URL for uploaded image');

      // Update existing images to not be main
      if (profileImages.length > 0) {
        await supabase
          .from('profile_images')
          .update({ is_main: false })
          .eq('profile_id', user.id);
      }

      // Insert new image as main
      const { data: imageData, error: insertError } = await supabase
        .from('profile_images')
        .insert({
          profile_id: user.id,
          image_url: publicUrl,
          is_main: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update profile avatar_url
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      // Add new image to images array
      setProfileImages(prev => [imageData, ...prev.map(img => ({ ...img, is_main: false }))]);

      // Close cropper and clean up
      setShowCropper(false);
      setSelectedFile(null);
      toast.success('Profile picture updated successfully');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      handleError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    setProfileData(prev => {
      // For relationship_status, handle the transition properly
      if (field === 'relationship_status') {
        const newStatus = value as 'single' | 'couple';
        const baseUpdate = {
          ...prev,
          relationship_status: newStatus || 'single'
        };

        if (newStatus === 'single') {
          return {
            ...baseUpdate,
            partner_email: null,
            partner_id: null,
            is_couple_profile: false,
            couple_verified: false
          };
        }
        return {
          ...baseUpdate,
          is_couple_profile: true
        };
      }
      
      // For partner_email, update couple-related fields
      if (field === 'partner_email') {
        return {
          ...prev,
          partner_email: value as string | null,
          is_couple_profile: Boolean(value),
          couple_verified: false // Reset verification when partner email changes
        };
      }

      // For select fields, ensure we never set null values
      if (['gender', 'preferred_gender', 'dater_archetype', 'school', 'profile_visibility'].includes(field)) {
        return {
          ...prev,
          [field]: value || ''
        };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanAvatarUrl = profileData.avatar_url || DEFAULT_AVATAR;
      const updatedProfile = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        age: profileData.age || null,
        gender: profileData.gender || '',
        preferred_gender: profileData.preferred_gender || '',
        dater_archetype: profileData.dater_archetype || '',
        school: profileData.school || '',
        descriptors: profileData.descriptors || [],
        avatar_url: cleanAvatarUrl,
        profile_visibility: profileData.profile_visibility || 'public',
        relationship_status: profileData.relationship_status || 'single',
        is_couple_profile: profileData.relationship_status === 'couple',
        partner_email: profileData.relationship_status === 'couple' ? profileData.partner_email : null,
        partner_id: profileData.relationship_status === 'couple' ? profileData.partner_id : null,
        couple_verified: profileData.relationship_status === 'couple' ? profileData.couple_verified : false
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(error.message);
      }

      // If this is a couple profile and partner email is provided, send invitation
      if (profileData.relationship_status === 'couple' && profileData.partner_email) {
        console.log('Sending partner invitation to:', profileData.partner_email);
        
        const response = await fetch('/api/invite-partner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerEmail: profileData.partner_email,
            userId: user.id,
            userName: profileData.first_name
          })
        });

        const responseData = await response.json();
        console.log('Partner invitation response:', responseData);

        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || 'Failed to send partner invitation');
        }
      }

      toast.success('Profile updated successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    const refreshImage = async () => {
      if (profileData.avatar_url && !profileData.avatar_url.startsWith('/images/')) {
        try {
          // If it's already a full URL and starts with http, keep using it
          if (profileData.avatar_url.startsWith('http')) {
            return;
          }

          // Clean up the path and ensure it doesn't have a dashboard prefix
          const cleanPath = profileData.avatar_url
            .replace(/^\/dashboard\//, '')
            .replace(/^avatars\//, '')
            .split('?')[0];

          // Get the public URL from Supabase storage
          const { data } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(cleanPath);

          if (data?.publicUrl) {
            setProfileData(prev => ({
              ...prev,
              avatar_url: data.publicUrl
            }));
          } else {
            console.error('Failed to get public URL for:', cleanPath);
            setProfileData(prev => ({
              ...prev,
              avatar_url: DEFAULT_AVATAR
            }));
          }
        } catch (error) {
          console.error('Error refreshing image:', error);
          setProfileData(prev => ({
            ...prev,
            avatar_url: DEFAULT_AVATAR
          }));
        }
      }
    };

    refreshImage();
  }, [profileData.avatar_url]);

  const handleResetPassword = () => {
    try {
      setIsLoading(true);
      // Just redirect to reset password page
      window.location.replace('/auth/reset-password');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to initiate password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescriptorSelect = async (descriptor: Descriptor) => {
    try {
      // Update local state first for immediate feedback
      const newDescriptors = profileData.descriptors.some(d => d.label === descriptor.label)
        ? profileData.descriptors.filter(d => d.label !== descriptor.label)
        : [...profileData.descriptors, descriptor];

      setProfileData(prev => ({
        ...prev,
        descriptors: newDescriptors
      }));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update Supabase immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ descriptors: newDescriptors })
        .eq('id', user.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error updating descriptors:', error);
      // Revert local state if there was an error
      setProfileData(prev => ({
        ...prev,
        descriptors: profileData.descriptors
      }));
    }
  };

  return (
    <EditProfileWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

              <TabsContent value="profile">
              <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Photos Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Profile Photos</h2>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-32 h-32">
                        <Image
                          src={profileData.avatar_url?.startsWith('http') ? profileData.avatar_url : DEFAULT_AVATAR}
                          alt="Profile"
                          fill
                          className="rounded-full object-cover"
                          priority={true}
                          onError={(e) => {
                            console.error('Error loading profile image:', profileData.avatar_url);
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_AVATAR;
                          }}
                        />
                        <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </label>
                      </div>

                      {/* Profile Image Gallery */}
                      <div className="w-full">
                        <ProfileImageGallery
                          images={profileImages}
                          onSetMain={handleSetMainImage}
                          onDelete={handleDeleteImage}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-8"></div>

                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={profileData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className="p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={profileData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className="p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                      required
                    />
                  </div>

                  {/* Age Field */}
                  <input
                    type="number"
                    placeholder="Age"
                    value={profileData.age === null ? '' : profileData.age}
                    onChange={(e) => handleChange('age', e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors mb-4"
                    required
                    min="18"
                    max="100"
                  />

                  {/* Bio Field */}
                  <textarea
                    placeholder="Bio"
                    value={profileData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#cc0000] transition-colors min-h-[100px] mb-4"
                    required
                  />

                  {/* School Selection */}
                  <select
                    value={profileData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors mb-4"
                    required
                  >
                    <option value="">Select School</option>
                    {SCHOOLS.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>

                  {/* Dating Preferences */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Dating Preferences</h3>
                    <div className="space-y-4">
                      <select
                        value={profileData.gender || ''}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                        required
                      >
                        <option value="">Your Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>

                      <select
                        value={profileData.preferred_gender || ''}
                        onChange={(e) => handleChange('preferred_gender', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                        required
                      >
                        <option value="">Interested In</option>
                        <option value="male">Men</option>
                        <option value="female">Women</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>

                  {/* Dating Style */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Dating Style</h3>
                    <div className="space-y-4">
                      <select
                        value={profileData.dater_archetype || ''}
                        onChange={(e) => handleChange('dater_archetype', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                        required
                      >
                        <option value="">Select Dating Style</option>
                        {ARCHETYPES.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <div className="sm:col-span-2">
                        <label htmlFor="relationship_status" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                          Relationship Status
                        </label>
                        <select
                          id="relationship_status"
                          name="relationship_status"
                          value={profileData.relationship_status || 'single'}
                          onChange={(e) => handleChange('relationship_status', e.target.value as 'single' | 'couple')}
                          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                        >
                          <option value="single">Single</option>
                          <option value="couple">In a Relationship</option>
                        </select>
                      </div>

                      {profileData.relationship_status === 'couple' && (
                        <>
                          <div className="sm:col-span-2">
                            <label htmlFor="partner_email" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                              Partner's Email
                            </label>
                            <div className="mt-2">
                              <input
                                type="email"
                                name="partner_email"
                                id="partner_email"
                                value={profileData.partner_email || ''}
                                onChange={(e) => handleChange('partner_email', e.target.value)}
                                className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                                placeholder="Enter your partner's email"
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              Your partner will receive an invitation to join your couple profile.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Descriptors */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Descriptors</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select words that best describe your personality, interests, and lifestyle.
                    </p>
                    <DescriptorBubbles
                      selectedDescriptors={profileData.descriptors}
                      onSelectDescriptor={handleDescriptorSelect}
                      maxSelections={10}
                    />
                  </div>

                {/* Remove the old save button location */}
                {/* Email Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                    <p className="text-sm text-gray-500">Manage your email preferences</p>
                  </div>
                  <div className="mt-4">
                      <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#cc0000] transition-colors"
                    />
                  </div>
                </div>

                {/* Add fixed position save button */}
                <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-40">
                  <div className="max-w-4xl mx-auto">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full bg-[#BA2525] text-white px-6 py-2.5 rounded-full hover:bg-[#a02020] transition-colors"
                      >
                      Save Changes
                      </button>
                    </div>
                  </div>

                {/* Password Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Password Settings</h3>
                    <p className="text-sm text-gray-500">Update your account password</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="w-full p-2.5 bg-white border border-[#BA2525] text-[#BA2525] rounded-full hover:bg-[#BA2525] hover:text-white transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 mt-8 pt-6 pb-24">
                    <button
                      type="button"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Log Out
                    </button>
                  </div>
              </form>
              </TabsContent>

              <TabsContent value="privacy">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Profile Visibility</h3>
                      <p className="text-sm text-gray-500">Control who can see your profile</p>
                    </div>
                    <select
                      value={profileData.profile_visibility}
                      onChange={(e) => handleChange('profile_visibility', e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  </div>

                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Groups Management</h3>
                  <GroupsSection />
                  </div>
              </div>
              </TabsContent>

            <TabsContent value="posts">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Posts</h2>
                <p className="text-gray-600">
                  View and manage your posts and interactions
                </p>
                {/* Add posts content here */}
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <PaymentSection
                profileData={profileData}
                setProfileData={setProfileData}
                profileImages={profileImages}
                setProfileImages={setProfileImages}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                showCropper={showCropper}
                setShowCropper={setShowCropper}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                previewUrl={previewUrl}
                avatarFile={avatarFile}
                imageError={imageError}
                setImageError={setImageError}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showCropper && selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </EditProfileWrapper>
  );
}

export default function Page() {
  return (
    <Elements stripe={stripePromise}>
      <EditProfilePage />
    </Elements>
  );
}
'use client'

import React, { useState, type ChangeEvent } from 'react'
import { Prompt } from 'next/font/google'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/client'
import ImageCropper from '@/components/ImageCropper'
import DescriptorBubbles from '@/components/DescriptorBubbles'
import Link from 'next/link'

const prompt = Prompt({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  location: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  preferredGender: string;
  relationshipStatus: 'single' | 'couple';
  partnerEmail: string;
  bio: string;
  descriptors: Array<{ category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }>;
  profileVisibility: 'public' | 'private';
  showLoginLink: boolean;
  avatarFile: File | null;
  previewUrl: string | null;
  showCropper: boolean;
  selectedFile: File | null;
  coupleBio: string;
  isCoupleProfile: boolean;
  school: string;
  isLoading: boolean;
}

const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  // Implementation here
  return null;
};

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    location: 'boston',
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    preferredGender: '',
    relationshipStatus: 'single',
    partnerEmail: '',
    bio: '',
    descriptors: [],
    profileVisibility: 'public',
    showLoginLink: false,
    avatarFile: null,
    previewUrl: null,
    showCropper: false,
    selectedFile: null,
    coupleBio: '',
    isCoupleProfile: false,
    school: '',
    isLoading: false
  })
  const [error, setError] = useState<string | null>(null)
  const [showLoginLink, setShowLoginLink] = useState(false)

  const validateBCEmail = (email: string): boolean => {
    return true // Allow any email domain
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate location
    if (formData.location.toLowerCase() !== 'boston') {
      setError('Sorry, Ophelia Dating is currently only available in Boston.');
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Upload avatar if selected
        let avatarUrl = null;
        if (formData.selectedFile) {
          avatarUrl = await uploadAvatar(authData.user.id, formData.selectedFile);
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email.toLowerCase(),
            avatar_url: avatarUrl,
            school: formData.school || null,
            age: parseInt(formData.age),
            gender: formData.gender,
            preferred_gender: formData.preferredGender,
            bio: formData.relationshipStatus === 'single' ? formData.bio.trim() : formData.coupleBio.trim(),
            descriptors: formData.descriptors,
            relationship_status: formData.relationshipStatus,
            partner_email: formData.relationshipStatus === 'couple' ? formData.partnerEmail.toLowerCase().trim() : null,
            is_couple_profile: formData.relationshipStatus === 'couple',
            profile_visibility: formData.profileVisibility,
          });

        if (profileError) throw profileError;

        // Send welcome email
        await fetch('/api/send-signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            templateId: process.env.NEXT_PUBLIC_SENDGRID_SIGNUP_TEMPLATE_ID,
            dynamicTemplateData: {
              first_name: formData.firstName,
              last_name: formData.lastName
            }
          })
        });

        router.push('/quiz');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    setFormData(prev => ({ ...prev, selectedFile: file }))
    setFormData(prev => ({ ...prev, showCropper: true }))
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], formData.selectedFile?.name || 'profile.jpg', {
      type: 'image/jpeg'
    })

    setFormData(prev => ({ ...prev, avatarFile: croppedFile }))
    const url = URL.createObjectURL(croppedBlob)
    if (formData.previewUrl) {
      URL.revokeObjectURL(formData.previewUrl)
    }
    setFormData(prev => ({ ...prev, previewUrl: url }))
    setFormData(prev => ({ ...prev, showCropper: false }))
    setFormData(prev => ({ ...prev, selectedFile: null }))
  }

  const handleCropCancel = () => {
    setFormData(prev => ({ ...prev, showCropper: false }))
    setFormData(prev => ({ ...prev, selectedFile: null }))
  }

  const handleDescriptorSelect = (descriptor: { category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }) => {
    setFormData(prev => ({
      ...prev,
      descriptors: prev.descriptors.some(d => d.label === descriptor.label)
        ? prev.descriptors.filter(d => d.label !== descriptor.label)
        : [...prev.descriptors, descriptor]
    }));
  }

  const renderCoupleFields = () => {
    if (formData.relationshipStatus !== 'couple') return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Partner's Email
          </label>
          <input
            type="email"
            value={formData.partnerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, partnerEmail: e.target.value }))}
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
            required
            placeholder="Enter your partner's email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Couple Bio
          </label>
          <textarea
            value={formData.coupleBio}
            onChange={(e) => setFormData(prev => ({ ...prev, coupleBio: e.target.value }))}
            className="w-full p-2.5 border border-gray-200 rounded-3xl outline-none focus:border-[#BA2525] transition-colors min-h-[120px] resize-none"
            placeholder="Tell us about you as a couple..."
            rows={4}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-md mx-auto p-5 ${prompt.className}`}>
      <h2 className="text-center text-[#BA2525] font-bold text-3xl mb-6">
        Create Your Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
          {showLoginLink && (
            <div className="mt-2">
              <Link href="/auth/login" className="text-[#BA2525] hover:underline">
                Click here to log in
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
            {formData.previewUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={formData.previewUrl}
                  alt="Profile preview"
                  fill
                  className="object-cover rounded-full"
                  sizes="(max-width: 768px) 100vw, 128px"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <p className="mb-2 text-xs text-gray-500 text-center">
                  Add Photo
                </p>
                <p className="text-xs text-red-500 text-center">
                  Required
                </p>
              </div>
            )}
            <input
              type="file"
              name="avatar"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={formData.relationshipStatus === 'couple'}
              required
              autoComplete="photo"
            />
          </label>
        </div>

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          autoComplete="email"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          minLength={6}
          autoComplete="new-password"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          autoComplete="given-name"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          autoComplete="family-name"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          min="18"
          max="100"
          autoComplete="age"
        />

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          value={formData.gender}
          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
          autoComplete="sex"
        >
          <option value="">Select Your Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          value={formData.preferredGender}
          onChange={(e) => setFormData(prev => ({ ...prev, preferredGender: e.target.value }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
        >
          <option value="">Select Partner's Preferred Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="other">Other</option>
        </select>

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          value={formData.relationshipStatus}
          onChange={(e) => setFormData(prev => ({ ...prev, relationshipStatus: e.target.value as 'single' | 'couple' }))}
          disabled={formData.relationshipStatus === 'couple'}
          required
        >
          <option value="">Select Relationship Status</option>
          <option value="single">Single</option>
          <option value="couple">In a Relationship</option>
        </select>

        {formData.relationshipStatus === 'single' && (
          <textarea
            className="w-full p-2.5 border border-gray-200 rounded-3xl outline-none focus:border-[#BA2525] transition-colors min-h-[120px] resize-none"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={formData.relationshipStatus !== 'single'}
            rows={4}
          />
        )}

        {renderCoupleFields()}

        <div className="mb-6" onClick={(e) => e.preventDefault()}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.relationshipStatus === 'couple' ? 'Select Descriptors for Your Couple Profile' : 'Select Your Descriptors'}
          </label>
          <DescriptorBubbles
            selectedDescriptors={formData.descriptors}
            onSelectDescriptor={handleDescriptorSelect}
            maxSelections={10}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Visibility
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="profile_visibility"
                value="public"
                checked={formData.profileVisibility === 'public'}
                onChange={(e) => setFormData(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                className="mr-2 text-[#BA2525] focus:ring-[#BA2525]"
              />
              <span className="text-sm text-gray-600">Public</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="profile_visibility"
                value="private"
                checked={formData.profileVisibility === 'private'}
                onChange={(e) => setFormData(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                className="mr-2 text-[#BA2525] focus:ring-[#BA2525]"
              />
              <span className="text-sm text-gray-600">Private</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Public profiles are visible to all users. Private profiles are only visible to your groups.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cc0000]"
            required
          >
            <option value="boston">Boston</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Currently only available in Boston</p>
        </div>

        <button
          type="submit"
          className="w-full p-2.5 mt-8 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a01f1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={formData.isLoading}
        >
          {formData.isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}

        {showLoginLink && (
          <p className="mt-4 text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#BA2525] hover:underline">
              Log In
            </Link>
          </p>
        )}
      </form>

      {formData.showCropper && formData.selectedFile && (
        <ImageCropper
          imageFile={formData.selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  )
}
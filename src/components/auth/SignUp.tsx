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

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [preferredGender, setPreferredGender] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState<'single' | 'in_relationship'>('single')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [bio, setBio] = useState('')
  const [descriptors, setDescriptors] = useState<Array<{ category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }>>([])
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateBCEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('.edu')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateBCEmail(email)) {
      setError('Please use a valid .edu email address')
      return
    }

    if (!avatarFile) {
      setError('Please upload a profile picture')
      return
    }

    setIsLoading(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      if (!authData?.user?.id) {
        throw new Error('Failed to create account')
      }

      // Upload avatar
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.toLowerCase().trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          age: parseInt(age),
          gender,
          preferred_gender: preferredGender,
          avatar_url: urlData?.publicUrl,
          relationship_status: relationshipStatus,
          partner_email: relationshipStatus === 'in_relationship' ? partnerEmail.trim() : null,
          bio: bio.trim(),
          descriptors,
          profile_visibility: profileVisibility,
          school: 'Boston College',
          dater_status: 'bronze',
          average_rating: 5.0,
          follow_through_rate: 100
        })

      if (profileError) {
        throw profileError
      }

      alert('Account created! Please check your email to verify your account.')
      router.push('/quiz')
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    setSelectedFile(file)
    setShowCropper(true)
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], selectedFile?.name || 'profile.jpg', {
      type: 'image/jpeg'
    })

    setAvatarFile(croppedFile)
    const url = URL.createObjectURL(croppedBlob)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(url)
    setShowCropper(false)
    setSelectedFile(null)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setSelectedFile(null)
  }

  const handleDescriptorSelect = (descriptor: { category: 'Personality' | 'Interests' | 'Lifestyle'; label: string }) => {
    setDescriptors(prev => 
      prev.some(d => d.label === descriptor.label)
        ? prev.filter(d => d.label !== descriptor.label)
        : [...prev, descriptor]
    )
  }

  return (
    <div className={`max-w-md mx-auto p-5 ${prompt.className}`}>
      <h2 className="text-center text-[#BA2525] font-bold text-3xl mb-6">
        Create Your Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
          {error.includes('already registered') && (
            <div className="mt-2">
              <Link href="/auth/login" className="text-[#BA2525] hover:underline">
                Click here to log in
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
            {previewUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl}
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
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading}
              required
              autoComplete="photo"
            />
          </label>
        </div>

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          minLength={6}
          autoComplete="new-password"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="given-name"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="family-name"
        />

        <input
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          disabled={isLoading}
          required
          min="18"
          max="100"
          autoComplete="age"
        />

        <select
          className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={isLoading}
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
          value={preferredGender}
          onChange={(e) => setPreferredGender(e.target.value)}
          disabled={isLoading}
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
          value={relationshipStatus}
          onChange={(e) => setRelationshipStatus(e.target.value as 'single' | 'in_relationship')}
          disabled={isLoading}
          required
        >
          <option value="">Select Relationship Status</option>
          <option value="single">Single</option>
          <option value="in_relationship">In a Relationship</option>
        </select>

        {relationshipStatus === 'in_relationship' && (
          <input
            className="w-full p-2.5 border border-gray-200 rounded-full outline-none focus:border-[#BA2525] transition-colors"
            type="email"
            placeholder="Partner's Email"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
          />
        )}

        <textarea
          className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#BA2525] transition-colors min-h-[100px]"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={isLoading}
        />

        <div className="mb-6" onClick={(e) => e.preventDefault()}>
          <DescriptorBubbles
            selectedDescriptors={descriptors}
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
                checked={profileVisibility === 'public'}
                onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private')}
                className="mr-2 text-[#BA2525] focus:ring-[#BA2525]"
              />
              <span className="text-sm text-gray-600">Public</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="profile_visibility"
                value="private"
                checked={profileVisibility === 'private'}
                onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private')}
                className="mr-2 text-[#BA2525] focus:ring-[#BA2525]"
              />
              <span className="text-sm text-gray-600">Private</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Public profiles are visible to all users. Private profiles are only visible to your groups.
          </p>
        </div>

        <button
          type="submit"
          className="w-full p-2.5 mt-8 bg-[#BA2525] text-white rounded-full font-medium hover:bg-[#a01f1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {showCropper && selectedFile && (
        <ImageCropper
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  )
}
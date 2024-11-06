'use client'

import React from 'react'
import { commonStyles } from '../commonStyles.ts'

interface ProfileSetupProps {
  onComplete: () => void
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  return (
    <div style={commonStyles.container}>
      <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
        Set Up Your Profile
      </h2>
      <input style={commonStyles.input} type="text" placeholder="Full Name" />
      <input style={commonStyles.input} type="number" placeholder="Age" />
      <select style={commonStyles.input}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <select style={commonStyles.input}>
        <option value="">Select School</option>
        <option value="Boston College">Boston College</option>
        <option value="Harvard">Harvard</option>
        <option value="MIT">MIT</option>
        <option value="Northeastern">Northeastern</option>
        <option value="BU">BU</option>
        <option value="N/A">N/A</option>
      </select>
      <button style={commonStyles.button} onClick={onComplete}>Continue</button>
    </div>
  )
}

export default ProfileSetup

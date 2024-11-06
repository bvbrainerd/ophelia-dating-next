'use client'

import React from 'react'
import { commonStyles } from '../commonStyles'

interface ResultScreenProps {
  datingStyle: string
  onContinue: () => void
}

const ResultScreen: React.FC<ResultScreenProps> = ({ datingStyle, onContinue }) => {
  return (
    <div style={commonStyles.container}>
      <h2 style={{...commonStyles.h2, color: '#cc0000', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px'}}>
        Your Dating Style
      </h2>
      <p style={{textAlign: 'center', fontSize: '24px', marginBottom: '20px'}}>
        You are a <strong>{datingStyle}</strong>!
      </p>
      <p style={{textAlign: 'center', marginBottom: '30px'}}>
        Let's start dating and find your perfect match!
      </p>
      <button style={commonStyles.button} onClick={onContinue}>
        Continue to Dashboard
      </button>
    </div>
  )
}

export default ResultScreen
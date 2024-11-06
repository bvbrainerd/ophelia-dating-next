'use client'

interface ResultScreenProps {
  datingStyle: string
  onContinue: () => void
}

export default function ResultScreen({ datingStyle, onContinue }: ResultScreenProps) {
  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-center text-[#cc0000] font-bold text-3xl mb-6">
        Your Dating Style
      </h2>
      
      <p className="text-center text-2xl mb-4">
        You are a <strong>{datingStyle}</strong>!
      </p>
      
      <p className="text-center mb-8">
        Let's start dating and find your perfect match!
      </p>
      
      <button 
        className="w-full p-2.5 bg-[#cc0000] text-white rounded-full font-medium hover:bg-[#aa0000] transition-colors"
        onClick={onContinue}
      >
        Continue to Dashboard
      </button>
    </div>
  )
}
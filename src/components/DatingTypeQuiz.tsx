'use client'

import React, { useState } from 'react'

interface DatingTypeQuizProps {
  onComplete: (style: string) => void
}

const DatingTypeQuiz: React.FC<DatingTypeQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const questions = [
    {
      question: "On a first date, you prefer:",
      options: [
        "A romantic dinner at a restaurant",
        "An exciting activity like going somewhere",
        "A casual coffee meet-up",
        "A fun group activity with friends"
      ]
    },
    {
      question: "Your ideal partner is someone who:",
      options: [
        "Is romantic and golden-retriever like",
        "Is ambitious and driven",
        "Is happy, laid-back, and easy-going",
        "Is intellectual and nerdy"
      ]
    }
  ]

  const handleAnswer = (answer: number) => {
    setAnswers({...answers, [currentQuestion]: answer})
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      const datingStyle = determineDatingStyle()
      onComplete(datingStyle)
    }
  }

  const determineDatingStyle = () => {
    const styleScores = {
      "Hopeless Romantic": 0,
      "Serial Dater": 0,
      "Commitment Seeker": 0,
      "Cautious Dater": 0,
      "Friends with Benefits": 0
    }

    Object.values(answers).forEach((answer) => {
      switch(answer) {
        case 0:
          styleScores["Hopeless Romantic"] += 1
          break
        case 1:
          styleScores["Serial Dater"] += 1
          break
        case 2:
          styleScores["Friends with Benefits"] += 1
          break
        case 3:
          styleScores["Cautious Dater"] += 1
          break
      }
    })

    let maxScore = 0
    let resultStyle = "Cautious Dater"

    Object.entries(styleScores).forEach(([style, score]) => {
      if (score > maxScore) {
        maxScore = score
        resultStyle = style
      }
    })

    return resultStyle
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <h2 className="text-[#cc0000] font-bold text-center mb-5">
        What's Your Dating Style?
      </h2>
      <p className="text-center mb-5">
        Question {currentQuestion + 1} of {questions.length}
      </p>
      <h3 className="text-center mb-5 text-lg">
        {questions[currentQuestion].question}
      </h3>
      <div className="space-y-2.5">
        {questions[currentQuestion].options.map((option, index) => (
          <button 
            key={index}
            className="w-full p-2.5 bg-[#cc0000] text-white rounded-full cursor-pointer font-medium hover:bg-[#aa0000] transition-colors"
            onClick={() => handleAnswer(index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DatingTypeQuiz
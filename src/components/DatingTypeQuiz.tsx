import React, { useState } from 'react';

interface DatingTypeQuizProps {
  onComplete: (style: string) => void;
}

const DatingTypeQuiz: React.FC<DatingTypeQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({
    cautious: 0,
    hopeless: 0,
    commitment: 0,
    serial: 0,
    fwb: 0
  });

  // Questions mapped to archetype tendencies
  const questions = [
    {
      question: "What is your Ideal Date?:",
      options: [
        { text: "Dinner or Bar", scores: { cautious: 2, commitment: 1 } },
        { text: "Sports Game", scores: { fwb: 2, serial: 1 } },
        { text: "Concert/Activity", scores: { hopeless: 2, commitment: 1 } },
        { text: "A fun group activity with friends", scores: { fwb: 2, serial: 1 } }
      ]
    },
    {
      question: "How often do you text or call/FaceTime?:",
      options: [
        { text: "Once a day", scores: { cautious: 2, commitment: 1 } },
        { text: "Every so often", scores: { fwb: 2, serial: 1 } },
        { text: "Often", scores: { hopeless: 2, commitment: 1 } },
        { text: "You won't hear from me", scores: { serial: 2, fwb: 1 } }
      ]
    },
    {
      question: "Do You Care if Your Partner has a Close Best Friend?:",
      options: [
        { text: "No, I don't care", scores: { fwb: 2, cautious: 1 } },
        { text: "I'd be skeptical, but it's fine", scores: { commitment: 2, hopeless: 1 } },
        { text: "Yes, I care", scores: { hopeless: 2, commitment: 1 } },
        { text: "He's not allowed", scores: { serial: 2 } }
      ]
    },
    {
      question: "What do you do after fights?:",
      options: [
        { text: "Talk about it immediately", scores: { commitment: 2, hopeless: 1 } },
        { text: "Walk away and talk about it later", scores: { cautious: 2, commitment: 1 } },
        { text: "Act like nothing happened", scores: { fwb: 2, serial: 1 } },
        { text: "Be passive aggressive until we fight again", scores: { serial: 2, hopeless: 1 } }
      ]
    },
    {
      question: "How would you describe yourself?:",
      options: [
        { text: "Outgoing", scores: { serial: 2, fwb: 1 } },
        { text: "Reserved", scores: { cautious: 2, commitment: 1 } },
        { text: "Outgoing around friends but reserved around strangers", scores: { hopeless: 2, commitment: 1 } },
        { text: "Not really a people person...", scores: { cautious: 2 } }
      ]
    },
    {
      question: "How long before sex?:",
      options: [
        { text: "First Date", scores: { serial: 2, fwb: 1 } },
        { text: "A couple of dates", scores: { fwb: 2, serial: 1 } },
        { text: "The right moment for us", scores: { hopeless: 2, commitment: 1 } },
        { text: "Waiting for marriage", scores: { cautious: 2, commitment: 1 } }
      ]
    },
    {
      question: "What's your usual type?:",
      options: [
        { text: "Golden Retriever", scores: { hopeless: 2, commitment: 1 } },
        { text: "Nerd", scores: { cautious: 2, commitment: 1 } },
        { text: "Indie", scores: { serial: 2, fwb: 1 } },
        { text: "Preppy", scores: { fwb: 2, serial: 1 } }
      ]
    }
  ];

  const handleAnswer = (optionIndex: number) => {
    const option = questions[currentQuestion].options[optionIndex];
    
    // Update scores based on the selected option
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([style, points]) => {
      newScores[style as keyof typeof scores] += points;
    });
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const result = determineDatingStyle(newScores);
      onComplete(result);
    }
  };

  const determineDatingStyle = (finalScores: typeof scores) => {
    // Get the highest scoring style
    let maxScore = 0;
    let primaryStyle = '';
    Object.entries(finalScores).forEach(([style, score]) => {
      if (score > maxScore) {
        maxScore = score;
        primaryStyle = style;
      }
    });

    // Map the internal style names to database format
    const styleDatabaseNames = {
      cautious: 'cautiousDater',
      hopeless: 'hopelessRomantic',
      commitment: 'commitmentSeeker',
      serial: 'serialDater',
      fwb: 'friendsWithBenefits'
    };

    return styleDatabaseNames[primaryStyle as keyof typeof styleDatabaseNames];
  };

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
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DatingTypeQuiz;
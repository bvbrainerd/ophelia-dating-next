'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  question: string;
  options: string[];
}

interface StyleScores {
  'Cautious Dater': number;
  'Serial Dater': number;
  'Commitment Seeker': number;
  'Hopeless Romantic': number;
  'Friends with Benefits': number;
}

interface Answers {
  [key: number]: number;
}

export default function Page(): JSX.Element {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const router = useRouter(); 

  const questions: Question[] = [
    {
      question: 'On a first date, you prefer:',
      options: [
        'A romantic dinner at a restaurant',
        'An exciting activity like going somewhere',
        'A casual coffee meet-up',
        'A fun group activity with friends',
      ],
    },
    {
      question: 'Your ideal partner is someone who:',
      options: [
        'Is romantic and golden-retriever like',
        'Is ambitious and driven',
        'Is happy, laid-back, and easy-going',
        'Is intellectual and nerdy',
      ],
    },
    // ... rest of the questions
  ];

  const determineDatingStyle = (answers: Answers): string => {
    const styles: StyleScores = {
      'Cautious Dater': 0,
      'Serial Dater': 0,
      'Commitment Seeker': 0,
      'Hopeless Romantic': 0,
      'Friends with Benefits': 0,
    };

    // Example scoring logic based on answers
    Object.entries(answers).forEach(([question, answer]) => {
      switch (parseInt(question)) {
        case 0:
          styles['Hopeless Romantic'] += 1;
          break;
        case 1:
          styles['Serial Dater'] += 1;
          break;
        case 2:
          styles['Cautious Dater'] += 1;
          break;
        case 3:
          styles['Friends with Benefits'] += 1;
          break;
      }
    });

    return Object.keys(styles).reduce((a, b) =>
      styles[a as keyof StyleScores] > styles[b as keyof StyleScores] ? a : b,
    );
  };

  const handleAnswer = (answer: number): void => {
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const style = determineDatingStyle(newAnswers);
      setResult(style);
      setIsComplete(true);
    }
  };

  const handleContinue = (): void => {
    // Handle navigation to dashboard or next step
    router.push('/dashboard')
  };

  if (isComplete) {
    return (
      <div>
        <h2>Your Dating Style</h2>
        <p>
          You are a <strong>{result}</strong>!
        </p>

        {result === 'Cautious Dater' && (
          <p>
            You take your time getting to know someone. You value emotional
            connection and trust before moving forward.
          </p>
        )}

        {result === 'Serial Dater' && (
          <p>
            You enjoy meeting new people and aren't afraid to put yourself out
            there. You know what you want and aren't afraid to look for it.
          </p>
        )}

        {result === 'Commitment Seeker' && (
          <p>
            You're looking for something real and lasting. You value deep
            connections and are ready for a serious relationship.
          </p>
        )}

        {result === 'Hopeless Romantic' && (
          <p>
            You believe in true love and fairy tale endings. You wear your heart
            on your sleeve and love deeply.
          </p>
        )}

        {result === 'Friends with Benefits' && (
          <p>
            You're casual about dating and prefer keeping things light. You
            value your independence while still enjoying connections.
          </p>
        )}

        <button onClick={handleContinue}>Continue to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <h2>What's Your Dating Style?</h2>
      <p>
        Question {currentQuestion + 1} of {questions.length}
      </p>
      <h3>{questions[currentQuestion].question}</h3>
      {questions[currentQuestion].options.map((option, index) => (
        <button key={index} onClick={() => handleAnswer(index)}>
          {option}
        </button>
      ))}
    </div>
  );
}

import Header from '@/components/Header';

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white">
        <Header variant="matching" />
      </div>
      {children}
    </div>
  );
} 
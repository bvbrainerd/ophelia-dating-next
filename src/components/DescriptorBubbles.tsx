import React from 'react';

export interface Descriptor {
  category: 'Personality' | 'Interests' | 'Lifestyle';
  label: string;
}

export const DESCRIPTORS: Descriptor[] = [
  // Personality
  { category: 'Personality', label: 'Curious' },
  { category: 'Personality', label: 'Thoughtful' },
  { category: 'Personality', label: 'Easygoing' },
  { category: 'Personality', label: 'Loyal' },
  { category: 'Personality', label: 'Observant' },
  { category: 'Personality', label: 'Grounded' },
  { category: 'Personality', label: 'Open-minded' },
  { category: 'Personality', label: 'Chill' },
  { category: 'Personality', label: 'Driven' },
  { category: 'Personality', label: 'Witty' },
  { category: 'Personality', label: 'Laid-back' },
  { category: 'Personality', label: 'Sharp' },
  { category: 'Personality', label: 'Sincere' },
  { category: 'Personality', label: 'Playful' },
  { category: 'Personality', label: 'Upbeat' },
  { category: 'Personality', label: 'Independent' },
  { category: 'Personality', label: 'Warm' },
  { category: 'Personality', label: 'Adventurous' },

  // Interests
  { category: 'Interests', label: 'Love to cook' },
  { category: 'Interests', label: 'Food connoisseur' },
  { category: 'Interests', label: 'Avid traveler' },
  { category: 'Interests', label: 'Avid reader' },
  { category: 'Interests', label: 'Into fitness' },
  { category: 'Interests', label: 'Love music' },
  { category: 'Interests', label: 'Love art' },
  { category: 'Interests', label: 'Big on nature & the outdoors' },
  { category: 'Interests', label: 'Techy' },
  { category: 'Interests', label: 'Movie & TV fan' },
  { category: 'Interests', label: 'Casual gamer' },
  { category: 'Interests', label: 'Into photography' },
  { category: 'Interests', label: 'Love live music' },
  { category: 'Interests', label: 'Enjoys cooking' },
  { category: 'Interests', label: 'Sports fan' },

  // Lifestyle
  { category: 'Lifestyle', label: 'Morning person' },
  { category: 'Lifestyle', label: 'Night owl' },
  { category: 'Lifestyle', label: 'Homebody' },
  { category: 'Lifestyle', label: 'Social but low-key' },
  { category: 'Lifestyle', label: 'Career-focused' },
  { category: 'Lifestyle', label: 'Family-oriented' },
  { category: 'Lifestyle', label: 'Pet lover' },
  { category: 'Lifestyle', label: 'Love outdoors' },
  { category: 'Lifestyle', label: 'Enjoys downtime' },
  { category: 'Lifestyle', label: 'Down for anything' },
  { category: 'Lifestyle', label: 'Quiet>Chaos' },
  { category: 'Lifestyle', label: 'Work/Life Balance' },
];

interface DescriptorBubblesProps {
  selectedDescriptors: Descriptor[];
  onSelectDescriptor: (descriptor: Descriptor) => void;
  maxSelections?: number;
}

const DescriptorBubbles: React.FC<DescriptorBubblesProps> = ({
  selectedDescriptors = [],
  onSelectDescriptor,
  maxSelections = 10
}) => {
  const isSelected = React.useCallback((descriptor: Descriptor) => {
    return selectedDescriptors?.some(d => d.label === descriptor.label) || false;
  }, [selectedDescriptors]);

  const handleSelect = React.useCallback((descriptor: Descriptor) => {
    if (isSelected(descriptor) || selectedDescriptors.length < maxSelections) {
      onSelectDescriptor(descriptor);
    }
  }, [isSelected, maxSelections, onSelectDescriptor, selectedDescriptors.length]);

  return (
    <div className="space-y-6">
      {(['Personality', 'Interests', 'Lifestyle'] as const).map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {DESCRIPTORS.filter(d => d.category === category).map(descriptor => (
              <button
                key={descriptor.label}
                onClick={() => handleSelect(descriptor)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${isSelected(descriptor)
                    ? 'bg-[#BA2525] text-white hover:bg-[#a02020]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#BA2525] hover:text-[#BA2525]'
                  }`}
                disabled={!isSelected(descriptor) && selectedDescriptors.length >= maxSelections}
              >
                {descriptor.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-sm text-gray-500 mt-2">
        Select up to {maxSelections} descriptors ({selectedDescriptors.length} selected)
      </p>
    </div>
  );
};

export default DescriptorBubbles; 
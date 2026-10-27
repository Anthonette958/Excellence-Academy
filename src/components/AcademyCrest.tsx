import React, { useState } from 'react';
import { ACADEMY_CREST_IMG } from '../data/mockData';
import { Shield, Award } from 'lucide-react';

interface AcademyCrestProps {
  className?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AcademyCrest: React.FC<AcademyCrestProps> = ({
  className = 'w-full h-full object-cover',
  alt = 'Excellence Academy Crest',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="w-full h-full bg-gradient-to-br from-purple-800 to-purple-950 flex flex-col items-center justify-center text-amber-300 select-none p-1"
        title="Excellence Academy · Est. 1928"
      >
        <Shield className="w-3/5 h-3/5 text-amber-300 stroke-[1.8]" />
      </div>
    );
  }

  return (
    <img
      src={ACADEMY_CREST_IMG}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

import React from 'react';

interface SoccerBallIconProps {
  className?: string;
  alt?: string;
}

const SoccerBallIcon: React.FC<SoccerBallIconProps> = ({ 
  className = "w-8 h-8", 
  alt = "Team logo" 
}) => {
  return (
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/240px-Soccerball.svg.png"
      alt={alt}
      className={`${className} object-contain bg-transparent`}
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        // Fallback to a simple emoji if the Wikipedia image fails
        const target = e.currentTarget;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-lg">⚽</div>';
        }
      }}
      loading="lazy"
    />
  );
};

export default SoccerBallIcon; 
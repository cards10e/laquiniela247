import React, { useState } from 'react';
import SoccerBallIcon from './SoccerBallIcon';

interface TeamLogoProps {
  teamName: string;
  logoUrl?: string;
  className?: string;
  alt?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ 
  teamName, 
  logoUrl, 
  className = "w-8 h-8 rounded-full object-cover",
  alt 
}) => {
  const [currentSource, setCurrentSource] = useState<'url' | 'local' | 'fallback'>(
    logoUrl ? 'url' : 'local'
  );
  const [localPathIndex, setLocalPathIndex] = useState(0);

  // Function to generate possible local logo paths based on team name
  const getLocalLogoPath = (name: string): string => {
    const mappedName = getTeamMappedName(name);
    
    // Try different file name patterns that exist in your public folder
    const possiblePaths = [
      `/${mappedName}.png`,
      `/${mappedName}-150x150.png`,
      `/${mappedName}-1.png`,
      `/${mappedName}-1-150x150.png`,
      `/${mappedName}.jpeg`,
      `/${mappedName}-150x150.jpeg`
    ];

    // Path selection debug removed
    return possiblePaths[localPathIndex] || possiblePaths[0]; // Return the current pattern
  };

  const handleError = () => {
    if (currentSource === 'url') {
      // Try local file
      setCurrentSource('local');
      setLocalPathIndex(0);
    } else if (currentSource === 'local') {
      // Try next local path pattern
      const possiblePaths = [
        `/${getTeamMappedName(teamName)}.png`,
        `/${getTeamMappedName(teamName)}-150x150.png`,
        `/${getTeamMappedName(teamName)}-1.png`,
        `/${getTeamMappedName(teamName)}-1-150x150.png`,
        `/${getTeamMappedName(teamName)}.jpeg`,
        `/${getTeamMappedName(teamName)}-150x150.jpeg`
      ];
      
      if (localPathIndex < possiblePaths.length - 1) {
        setLocalPathIndex(localPathIndex + 1);
      } else {
        // Fall back to soccer ball
        setCurrentSource('fallback');
      }
    }
  };

  const getTeamMappedName = (name: string): string => {
    const teamMappings: Record<string, string> = {
      'Toluca FC': 'TOLUCA',
      'Tigres UANL': 'Tigres-UANL', 
      'León FC': 'LEON-FC',
      'Club América': 'AMERICA',
      'Club Necaxa': 'NECAXA',
      'Cruz Azul': 'CRUZ-AZUL',
      'Tijuana': 'BRAVOS',
      'TOLUCA-FC': 'TOLUCA',
      'TOLUCA': 'TOLUCA',
      'TIGRES-UANL': 'Tigres-UANL',
      'TIGRES': 'Tigres-UANL',
      'LEON-FC': 'LEON-FC',
      'LEÓN-FC': 'LEON-FC',
      'LEON': 'LEON-1',
      'LEÓN': 'LEON-1',
      'AMÉRICA': 'AMERICA',
      'AMERICA': 'AMERICA',
      'CLUB-AMÉRICA': 'AMERICA',
      'CLUB-AMERICA': 'AMERICA',
      'NECAXA': 'NECAXA',
      'CLUB-NECAXA': 'NECAXA',
      'CRUZ-AZUL': 'CRUZ-AZUL',
      'CRUZAZUL': 'CRUZ-AZUL',
      'CHIVAS': 'CHIVAS',
      'GUADALAJARA': 'CHIVAS',
      'PUMAS': 'PUMAS',
      'MONTERREY': 'RAYADOS',
      'RAYADOS': 'RAYADOS',
      'SANTOS-LAGUNA': 'SANTOS-LAGUNA',
      'SANTOS': 'SANTOS-LAGUNA',
      'ATLAS': 'ATLAS',
      'PACHUCA': 'PACHUCA',
      'PUEBLA': 'PUEBLA',
      'QUERÉTARO': 'QUERETARO',
      'QUERETARO': 'QUERETARO',
      'MAZATLÁN': 'MAZATLAN',
      'MAZATLAN': 'MAZATLAN',
      'ATLÉTICO-SAN-LUIS': 'ATLETICO-SL',
      'ATLETICO-SAN-LUIS': 'ATLETICO-SL',
      'SAN-LUIS': 'ATLETICO-SL',
      'FC-JUÁREZ': 'BRAVOS',
      'FC-JUAREZ': 'BRAVOS',
      'JUÁREZ': 'BRAVOS',
      'JUAREZ': 'BRAVOS',
      'BRAVOS': 'BRAVOS',
      'TIJUANA': 'BRAVOS'
    };

    let mappedName = teamMappings[name];
    
    if (!mappedName) {
      const normalized = name
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/CLUB\s*/i, '')
        .replace(/ATLÉTICO/i, 'ATLETICO')
        .replace(/LEÓN/i, 'LEON')
        .replace(/QUERÉTARO/i, 'QUERETARO')
        .replace(/MAZATLÁN/i, 'MAZATLAN');
      
      mappedName = teamMappings[normalized] || normalized;
    }
    
    return mappedName;
  };

  const altText = alt || teamName || 'Team logo';

  if (currentSource === 'fallback') {
    return <SoccerBallIcon className={className} alt={altText} />;
  }

  const src = currentSource === 'url' ? logoUrl : getLocalLogoPath(teamName);

  return (
    <img
      src={src}
      alt={altText}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default TeamLogo; 
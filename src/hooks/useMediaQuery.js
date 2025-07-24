import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Update the state with the current value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create an event listener
    const listener = () => {
      setMatches(media.matches);
    };

    // Listen for changes
    media.addEventListener('change', listener);

    // Clean up
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [matches, query]);

  return matches;
}
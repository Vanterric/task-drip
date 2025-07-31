import { useEffect, useState } from 'react';

let hasUserInteracted = false;
const listeners = new Set();

export const useHasInteracted = () => {
  const [hasInteracted, setHasInteracted] = useState(hasUserInteracted);

  useEffect(() => {
    if (hasUserInteracted) return;

    const onInteract = () => {
      hasUserInteracted = true;
      listeners.forEach((cb) => cb(true));
      window.removeEventListener('pointerdown', onInteract);
    };

    listeners.add(setHasInteracted);
    window.addEventListener('pointerdown', onInteract, { once: true });

    return () => {
      listeners.delete(setHasInteracted);
    };
  }, []);

  return hasInteracted;
};

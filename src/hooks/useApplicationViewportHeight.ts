import { useEffect, useState } from 'react';

const MIN_APPLICATION_HEIGHT = 667;

function getApplicationHeight() {
  return Math.max(Math.ceil(window.innerHeight), MIN_APPLICATION_HEIGHT);
}

export function useApplicationViewportHeight() {
  const [height, setHeight] = useState(getApplicationHeight);

  useEffect(() => {
    const updateHeight = () => setHeight(getApplicationHeight());

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return height;
}

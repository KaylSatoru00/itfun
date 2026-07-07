// use_block_back_navigation.js
import { useEffect } from 'react';

export default function useBlockBackNavigation() {
  useEffect(() => {
    // Idagdag ng dummy entry sa history stack
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Kapag pinindot ang back, agad na "ipupush" ulit
      // pabalik dito para hindi makaalis ang user sa page na ito
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
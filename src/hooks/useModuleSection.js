// useModuleSection.js
// ─────────────────────────────────────────────────────────────
// Shared hook for all module pages (s1–s9).
// Reads the ?section=xxx URL query param on mount and sets
// the activeSection state to the matching lesson key.
// If no param or param doesn't match any valid key, falls back
// to the provided defaultSection.
//
// Usage in any s*.jsx:
//   import { useModuleSection } from '../hooks/useModuleSection';
//
//   const [activeSection, setActiveSection] = useModuleSection(
//     'introduction',                          // default section key
//     ['introduction', 'functionalities', 'history']  // valid keys
//   );
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useModuleSection(defaultSection, validKeys = []) {
  const location = useLocation();

  const getInitialSection = () => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && (validKeys.length === 0 || validKeys.includes(section))) {
      return section;
    }
    return defaultSection;
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);

  // Also react if the URL changes while already on the page
  // (e.g. user searches again from within the module page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && (validKeys.length === 0 || validKeys.includes(section))) {
      setActiveSection(section);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return [activeSection, setActiveSection];
}
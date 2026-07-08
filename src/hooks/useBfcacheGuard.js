// hooks/useBfcacheGuard.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

/**
 * Pinoprotektahan ang mga protected pages laban sa "back button pagkatapos
 * mag-logout" — kapag pinindot ng user ang browser back/forward papunta sa
 * isang pahinang naka-cache ng browser (bfcache), naka-restore ang buong
 * React state (kasama ang dating "naka-login" na UI) nang hindi na
 * tumatakbo ulit ang normal na mount logic.
 *
 * Dito, kapag na-restore mula sa bfcache (`event.persisted === true`),
 * i-verify natin laban sa TOTOONG Firebase auth state sa halip na basta
 * tiwalaan ang cached UI — kung wala nang currentUser (totoong naka-logout
 * na), itulak papunta sa login/home. Kung meron pa, walang gagawin.
 */
export function useBfcacheGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    function handlePageShow(event) {
      if (!event.persisted) return; // normal na navigation, walang gawin

      const auth = getAuth();
      if (!auth.currentUser) {
        navigate('/', { replace: true });
      }
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [navigate]);
}
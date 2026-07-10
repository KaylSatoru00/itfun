import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './user_context';

// Bumabalot sa student-login page. Kung naka-login na ang tab na ito,
// i-redirect palayo papunta sa learning-modules — walang paraan para
// makarating ang authenticated user pabalik sa form mismo.
export default function RedirectIfAuthed({ children }) {
  const { user, authLoading } = useUser();

  // ── bfcache handling ──
  // Kapag pinindot ang Back papunta sa isang page na naka-imbak sa bfcache
  // (back/forward cache — literal na snapshot ng page sa memory ng
  // browser), HINDI umuulit ang buong React mount/render cycle — kaya
  // hindi sapat ang `if (user?.uid) return <Navigate .../>` sa ibaba
  // para sa CASE na ito. Ang `pageshow` event lang (na may
  // `event.persisted === true`) ang tanging paraan para malaman nating
  // "bumalik tayo mula sa bfcache snapshot" — kailangan nating i-force
  // ang navigation dito gamit ang `window.location.replace()` (buong
  // reload, hindi client-side navigate) para talagang mapalitan ang
  // stale na snapshot.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted && user?.uid) {
        window.location.replace('/learning-modules');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [user?.uid]);

  // Kaparehong dahilan ng ProtectedRoute: habang `authLoading`, hindi pa
  // FINAL ang `user` na makikita natin dito — huwag munang magpasya kung
  // ipapakita ang login form o i-redirect palayo, dahil kung magpasya
  // tayo nang maaga (base sa `user === null` na optimistic/in-flight pa
  // lang), makikita ng isang naka-login nang tab ang login form
  // (reverse flash) bago siya matulak palabas pabalik sa learning-modules.
  if (authLoading) {
    return null;
  }

  if (user?.uid) {
    return <Navigate to="/learning-modules" replace />;
  }

  return children;
}
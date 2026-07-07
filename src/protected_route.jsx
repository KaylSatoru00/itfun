// protected_route.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from './user_context';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useUser();
  const location = useLocation();

  // Force re-check kapag bumalik galing bfcache
  // (hal. pag-click ng back button pagkatapos mag-logout)
  const [, forceRecheck] = useState(0);
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        forceRecheck((n) => n + 1);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
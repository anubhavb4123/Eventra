import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a route element and redirects to /organizer-login if the
 * organizer session is not active. The current URL is passed as `from`
 * state so the login page can redirect back after successful auth.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/organizer-login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
};

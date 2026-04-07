import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireFamily }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireFamily && !user.familyGroupId) {
    return <Navigate to="/family-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;

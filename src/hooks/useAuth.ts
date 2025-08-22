import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

// This custom hook provides an easy way to access the auth context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
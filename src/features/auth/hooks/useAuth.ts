import { useState, useEffect } from 'react';
import { User, AuthState } from '../domain/auth';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Mocking initial check
    const timer = setTimeout(() => {
      setState({
        user: {
          id: '1',
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'PATIENT',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async () => {
    // Implementation
  };

  const logout = async () => {
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return { ...state, login, logout };
};

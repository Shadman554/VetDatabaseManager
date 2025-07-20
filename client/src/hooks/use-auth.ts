import { useState, useEffect } from 'react';
import { authService, type AuthUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { username, password });
      const response = await api.login(username, password);
      console.log('Login response:', response);
      
      if (!response.user || !response.access_token) {
        throw new Error('Invalid response format');
      }
      
      authService.setAuth(response);
      setUser(response.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      authService.clearAuth();
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      // Still clear local auth even if API call fails
      authService.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    if (!authService.isAuthenticated()) {
      return false;
    }

    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      return true;
    } catch (error) {
      authService.clearAuth();
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
}

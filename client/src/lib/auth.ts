export interface AuthUser {
  id: string | number;
  username: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

class AuthService {
  private tokenKey = 'vet_admin_token';
  private userKey = 'vet_admin_user';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthUser | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  setAuth(authResponse: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResponse.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
  }

  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();

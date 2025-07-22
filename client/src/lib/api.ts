import { authService } from "./auth";

const API_BASE_URL = "https://python-database-production.up.railway.app";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class VetApiAuth {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Get credentials from server (which has access to environment variables)
    const response = await fetch('/api/vet-auth');
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to get API credentials');
    }
    
    const { token } = await response.json();
    this.token = token;
    // Set expiry to 55 minutes from now (assuming 1 hour token validity)
    this.tokenExpiry = Date.now() + (55 * 60 * 1000);
    
    return token;
  }

  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

const vetApiAuth = new VetApiAuth();

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add external API authentication for external endpoints
  if (url.includes(API_BASE_URL)) {
    try {
      const token = await vetApiAuth.getToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get API token:', error);
      throw new ApiError(401, 'Failed to authenticate with veterinary API');
    }
  } else {
    // Add local auth headers for local endpoints
    headers = { ...headers, ...authService.getAuthHeaders() };
  }

  try {
    console.log('Making request to:', url, 'with method:', options.method || 'GET');
    console.log('Request headers:', headers);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Request failed:', response.status, errorText);
      
      // If unauthorized, clear token and retry once
      if (response.status === 401 && url.includes(API_BASE_URL)) {
        vetApiAuth.clearToken();
        // Don't retry here to avoid infinite loops - let the user retry
      }
      
      throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error for URL:', url, error);
      throw new ApiError(0, 'Network error - check your connection');
    }
    console.error('Request error:', error);
    throw error;
  }
}

export const api = {
  // Authentication (using local server)
  login: async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authService.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me', {
      headers: authService.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  },

  // External API calls
  books: {
    create: async (data: any) => {
      const response = await makeRequest('/api/books/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/books/${queryString}`);
      return response.json();
    },

    update: async (title: string, data: any) => {
      const response = await makeRequest(`/api/books/${encodeURIComponent(title)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (title: string) => {
      const response = await makeRequest(`/api/books/${encodeURIComponent(title)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
    
    getCategories: async () => {
      const response = await makeRequest('/api/books/categories/list');
      return response.json();
    },
  },

  diseases: {
    create: async (data: any) => {
      const response = await makeRequest('/api/diseases/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/diseases/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/diseases/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/diseases/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  drugs: {
    create: async (data: any) => {
      const response = await makeRequest('/api/drugs/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/drugs/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/drugs/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      console.log('Attempting to delete drug:', name);
      console.log('Delete URL:', `/api/drugs/${encodeURIComponent(name)}`);
      
      try {
        const response = await makeRequest(`/api/drugs/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
        console.log('Delete response status:', response.status);
        const result = await response.json();
        console.log('Delete response:', result);
        return result;
      } catch (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    
    getClasses: async () => {
      const response = await makeRequest('/api/drugs/classes/list');
      return response.json();
    },
  },

  dictionary: {
    create: async (data: any) => {
      const response = await makeRequest('/api/dictionary/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/dictionary/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/dictionary/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/dictionary/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  staff: {
    create: async (data: any) => {
      const response = await makeRequest('/api/staff/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/staff/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/staff/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/staff/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  normalRanges: {
    create: async (data: any) => {
      const response = await makeRequest('/api/normal-ranges/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/normal-ranges/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/normal-ranges/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/normal-ranges/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
    
    getSpecies: async () => {
      const response = await makeRequest('/api/normal-ranges/species/list');
      return response.json();
    },
    
    getCategories: async () => {
      const response = await makeRequest('/api/normal-ranges/categories/list');
      return response.json();
    },
  },

  instruments: {
    create: async (data: any) => {
      const response = await makeRequest('/api/instruments/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/instruments/${queryString}`);
      return response.json();
    },
  },

  notes: {
    create: async (data: any) => {
      const response = await makeRequest('/api/notes/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/notes/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/notes/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/notes/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  urineSlides: {
    create: async (data: any) => {
      const response = await makeRequest('/api/urine-slides/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/urine-slides/${queryString}`);
      return response.json();
    },

    update: async (name: string, data: any) => {
      const response = await makeRequest(`/api/urine-slides/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (name: string) => {
      const response = await makeRequest(`/api/urine-slides/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  otherSlides: {
    create: async (data: any) => {
      const response = await makeRequest('/api/other-slides/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/other-slides/${queryString}`);
      return response.json();
    },

    update: async (slide_name: string, data: any) => {
      const response = await makeRequest(`/api/other-slides/${encodeURIComponent(slide_name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (slide_name: string) => {
      const response = await makeRequest(`/api/other-slides/${encodeURIComponent(slide_name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  stoolSlides: {
    create: async (data: any) => {
      const response = await makeRequest('/api/stool-slides/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/stool-slides/${queryString}`);
      return response.json();
    },

    update: async (slide_name: string, data: any) => {
      const response = await makeRequest(`/api/stool-slides/${encodeURIComponent(slide_name)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (slide_name: string) => {
      const response = await makeRequest(`/api/stool-slides/${encodeURIComponent(slide_name)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  notifications: {
    create: async (data: any) => {
      const response = await makeRequest('/api/notifications/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/notifications/${queryString}`);
      return response.json();
    },

    update: async (title: string, data: any) => {
      const response = await makeRequest(`/api/notifications/${encodeURIComponent(title)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (title: string) => {
      const response = await makeRequest(`/api/notifications/${encodeURIComponent(title)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  appLinks: {
    create: async (data: any) => {
      const response = await makeRequest('/api/app-links/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    getAll: async (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await makeRequest(`/api/app-links/${queryString}`);
      return response.json();
    },

    update: async (title: string, data: any) => {
      const response = await makeRequest(`/api/app-links/${encodeURIComponent(title)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    delete: async (title: string) => {
      const response = await makeRequest(`/api/app-links/${encodeURIComponent(title)}`, {
        method: 'DELETE',
      });
      return response.ok;
    },
  },

  about: {
    create: async (data: any) => {
      const response = await makeRequest('/api/about/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    get: async () => {
      const response = await makeRequest('/api/about/');
      return response.json();
    },
    
    update: async (data: any) => {
      const response = await makeRequest('/api/about/', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },
};

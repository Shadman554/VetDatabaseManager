import { authService } from "./auth";

const API_BASE_URL = "https://python-database-production.up.railway.app";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
  }

  return response;
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

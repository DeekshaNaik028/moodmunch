// frontend/src/services/api.js - UPDATED VERSION
import { API_BASE } from '../utils/constants';

class ApiService {
  async call(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: 'Request failed' 
        }));
        throw new Error(error.detail || 'Something went wrong');
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  auth = {
    register: (data) => this.call('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    login: (data) => this.call('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  };

  ingredients = {
    extractFromAudio: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/ingredients/extract-from-audio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: 'Audio processing failed' 
        }));
        throw new Error(error.detail || 'Audio processing failed');
      }
      return response.json();
    },
    extractFromText: (text) => this.call('/ingredients/extract-from-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  };

  recipes = {
    generate: (data) => this.call('/recipes/generate', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    getHistory: (limit = 10) => this.call(`/recipes/history?limit=${limit}`),
    getFavorites: () => this.call('/recipes/favorites'),
    toggleFavorite: (id) => {
      console.log('API - Toggling favorite for recipe ID:', id);
      return this.call(`/recipes/${id}/favorite`, { 
        method: 'POST' 
      });
    },
    deleteRecipe: (id) => this.call(`/recipes/history/${id}`, { 
      method: 'DELETE' 
    }),
  };

  users = {
    getProfile: async () => {
      console.log('API - Fetching user profile...');
      const response = await this.call('/users/me');
      console.log('API - Profile response:', response);
      return response;
    },
    updateProfile: async (data) => {
      console.log('API - Updating profile with data:', data);
      const response = await this.call('/users/me', { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      });
      console.log('API - Update response:', response);
      return response;
    },
  };

  analytics = {
    getDashboard: () => this.call('/analytics/dashboard'),
    getMoodTrends: (days = 30) => this.call(`/analytics/mood-trends?days=${days}`),
    getIngredientStats: () => this.call('/analytics/ingredient-stats'),
  };
}

export const api = new ApiService();
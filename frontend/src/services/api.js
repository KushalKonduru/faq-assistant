import axios from 'axios';
import { getSessionId } from '../utils/session';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 120000, // 2 minutes to handle free-tier cloud wakeups
});

// Automatically inject session ID header to isolate every user request
api.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const uploadDocument = async (file, onUploadProgress) => {
  const sessionId = getSessionId();
  const formData = new FormData();
  formData.append('file', file);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-session-id': sessionId,
    },
    timeout: 180000, // 3 minutes for embedding generation
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const deleteDocument = async (title) => {
  const response = await api.delete(`/documents/${encodeURIComponent(title)}`);
  return response.data;
};

export const clearSessionDocuments = async () => {
  const response = await api.delete('/documents/session/clear');
  return response.data;
};

export const generatePrompts = async (title) => {
  const response = await api.post('/documents/generate-prompts', { title });
  return response.data;
};

export const queryDocuments = async (question, match_threshold = 0.3, match_count = 5) => {
  const response = await api.post('/query', {
    question,
    match_threshold,
    match_count,
  });

  return response.data;
};

export default api;

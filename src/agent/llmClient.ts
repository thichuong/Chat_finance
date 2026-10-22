import { GoogleGenAI } from '@google/genai';
import { LOCAL_STORAGE_API_KEY } from '../config/constants';

export function getApiKey(): string {
  // 1. Check localStorage first
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_API_KEY) : null;
  if (storedKey && storedKey.trim()) {
    return storedKey.trim();
  }
  // 2. Fallback to Vite env variable
  const envKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

export function setApiKey(key: string) {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(LOCAL_STORAGE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_API_KEY);
    }
  }
}

export function getGenAIClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa thiết lập GOOGLE_API_KEY. Vui lòng bấm vào nút Cài đặt để nhập API Key!');
  }
  return new GoogleGenAI({ apiKey });
}


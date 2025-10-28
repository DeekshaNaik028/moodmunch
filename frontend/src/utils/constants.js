// FIXED: Removed trailing slash from production URL
export const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://moodmunch-backend.vercel.app'  // ✅ NO trailing slash
  : 'http://localhost:8000';

export const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
  { value: 'bored', emoji: '😑', label: 'Bored' },
];

export const CUISINES = [
  'any', 'italian', 'chinese', 'indian', 'mexican', 
  'american', 'japanese', 'french', 'thai', 'mediterranean'
];

export const DIETARY_PREFERENCES = [
  'vegetarian', 'vegan', 'gluten_free', 'keto', 
  'paleo', 'low_carb', 'high_protein', 'dairy_free', 'nut_free'
];

export const HEALTH_GOALS = [
  'weight_loss', 'muscle_gain', 'maintain_weight', 
  'heart_health', 'diabetes_management', 'balanced_diet', 'energy_boost'
];

// API timeout settings
export const API_TIMEOUT = 30000; // 30 seconds
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getStoredTheme = () => {
  return localStorage.getItem('theme') || 'light';
};

export const setStoredTheme = (theme) => {
  localStorage.setItem('theme', theme);
};

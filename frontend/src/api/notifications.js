import api from './index';

export const fetchRecentNotifications = async () => {
  const { data } = await api.get('/collaboration/activity/recent/');
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
};

import client from './client';
import { mockApi, USE_MOCK } from './mock';

const api = USE_MOCK ? mockApi : client;
export default api;
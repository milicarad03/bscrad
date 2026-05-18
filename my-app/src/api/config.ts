
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL;
export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/users/login`,
    REGISTER: `${API_BASE_URL}/users/user`,
    PROFILE: `${API_BASE_URL}/users/profile`,
    ALL_USERS: `${API_BASE_URL}/users/allusers`,
    DELETE_USER: (id: number) => `${API_BASE_URL}/users/user/${id}`,
    APPROVE_USER: (id: number) => `${API_BASE_URL}/users/approval/${id}`,
  },
  POSTS: {
    FEED: `${API_BASE_URL}/post/feed`,
    CREATE: `${API_BASE_URL}/post/post`,
    DRAFTS: `${API_BASE_URL}/post/drafts`,
    MYPOSTS:`${API_BASE_URL}/post/myposts`,
    PUBLISH: (id: number) => `${API_BASE_URL}/post/publish/${id}`,
  },
  DEVICE: {
    BASE: `${API_BASE_URL}/device`,
    GET_ONE: (id: string) => `${API_BASE_URL}/device/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/device/${id}`,
    TOGGLE: (id: string) => `${API_BASE_URL}/device/${id}/toggle`,
    DEVICE_DASHBOARD :`${API_BASE_URL}/device-dashboard/devices`,
    TELEMETRY: (id: string) => `${API_BASE_URL}/device/${id}/telemetry`,
    TELEMETRY_LATEST: (id: string) => `${API_BASE_URL}/device/${id}/telemetry/latest`,
  }
};
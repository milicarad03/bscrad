
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/users/login`,
    REGISTER: `${API_BASE_URL}/users/user`,
    PROFILE: `${API_BASE_URL}/users/profile`,
    ALL_USERS: `${API_BASE_URL}/users/allusers`,
  },
  POSTS: {
    FEED: `${API_BASE_URL}/post/feed`,
    CREATE: `${API_BASE_URL}/post/post`,
    DRAFTS: `${API_BASE_URL}/post/drafts`,
    MYPOSTS:`${API_BASE_URL}/post/myposts`,
    PUBLISH: (id: number) => `${API_BASE_URL}/post/publish/${id}`,
  }
};
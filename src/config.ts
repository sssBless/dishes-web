export const API_BASE_URL = 'https://dishes-server-pjla.onrender.com/api';
export const IMAGE_URL = 'https://dishes-server-pjla.onrender.com';

export const buildImageUrl = (path?: string | null) => {
  if (!path) {
    return null;
  }
  return `${IMAGE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

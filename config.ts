const getApiBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL;
    if (!url || url === 'undefined') {
        console.warn('VITE_API_URL is not set, defaulting to localhost');
        return 'http://localhost:5000';
    }
    return url;
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}${API_BASE_URL.endsWith('/') ? '' : '/'}api`;

console.log('Backend API URL initialized at:', API_URL);

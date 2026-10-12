
const BASE_URL = 'https://forum-api.dicoding.dev/v1';

const api = {
  async get(path, token = null) {
    return this.request(path, {
      method: 'GET',
      token,
    });
  },

  async post(path, body = null, token = null) {
    return this.request(path, {
      method: 'POST',
      body,
      token,
    });
  },

  async request(path, { method, body, token }) {
    const headers = {};

    if (body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== null ? { body: JSON.stringify(body) } : {}),
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.status === 'fail') {
      throw new Error(responseJson.message || 'Terjadi kesalahan pada API.');
    }

    return responseJson.data;
  },
};

export default api;

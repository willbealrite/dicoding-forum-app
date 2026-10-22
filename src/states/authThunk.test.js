import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser } from './authSlice';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

describe('loginUser thunk', () => {
  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('menyimpan token dan profil saat login berhasil', async () => {
    const user = { id: 'user-1', name: 'Kenken' };

    api.post.mockResolvedValueOnce({ token: 'token-test' });
    api.get.mockResolvedValueOnce({ user });

    const store = createTestStore();

    const result = await store.dispatch(
      loginUser({
        email: 'kenken@example.com',
        password: 'password123',
      }),
    );

    expect(result.type).toBe('auth/loginUser/fulfilled');
    expect(api.post).toHaveBeenCalledWith('/login', {
      email: 'kenken@example.com',
      password: 'password123',
    });
    expect(api.get).toHaveBeenCalledWith('/users/me', 'token-test');
    expect(localStorage.getItem('accessToken')).toBe('token-test');
    expect(store.getState().auth.token).toBe('token-test');
    expect(store.getState().auth.user).toEqual(user);
    expect(store.getState().auth.status).toBe('succeeded');
  });

  it('menangani kegagalan login dari API', async () => {
    api.post.mockRejectedValueOnce(new Error('Email atau password salah'));

    const store = createTestStore();

    const result = await store.dispatch(
      loginUser({
        email: 'kenken@example.com',
        password: 'salah',
      }),
    );

    expect(result.type).toBe('auth/loginUser/rejected');
    expect(store.getState().auth.status).toBe('failed');
    expect(store.getState().auth.error).toBe('Email atau password salah');
    expect(api.get).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('menolak respons login yang tidak memiliki token', async () => {
    api.post.mockResolvedValueOnce({});

    const store = createTestStore();

    const result = await store.dispatch(
      loginUser({
        email: 'kenken@example.com',
        password: 'password123',
      }),
    );

    expect(result.type).toBe('auth/loginUser/rejected');
    expect(store.getState().auth.status).toBe('failed');
    expect(store.getState().auth.error).toBe(
      'Token tidak ditemukan pada respons login.',
    );
    expect(api.get).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

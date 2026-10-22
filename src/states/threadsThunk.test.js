import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import threadsReducer, { fetchThreads } from './threadsSlice';
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
      threads: threadsReducer,
      auth: (state = { token: 'test-token', user: { id: 'user-1' } }) => state,
    },
  });
}

describe('fetchThreads thunk', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('mengambil thread dan menghubungkan setiap thread dengan pemiliknya', async () => {
    api.get
      .mockResolvedValueOnce({
        threads: [
          {
            id: 'thread-1',
            title: 'Belajar React',
            ownerId: 'user-1',
          },
          {
            id: 'thread-2',
            title: 'Belajar Redux',
            ownerId: 'user-2',
          },
        ],
      })
      .mockResolvedValueOnce({
        users: [{ id: 'user-1', name: 'Andi' }, { id: 'user-2', name: 'Budi' }],
      });

    const store = createTestStore();

    await store.dispatch(fetchThreads());

    const state = store.getState().threads;

    expect(api.get).toHaveBeenNthCalledWith(1, '/threads');
    expect(api.get).toHaveBeenNthCalledWith(2, '/users');
    expect(state.status).toBe('succeeded');
    expect(state.items[0].owner).toEqual({ id: 'user-1', name: 'Andi' });
    expect(state.items[1].owner).toEqual({ id: 'user-2', name: 'Budi' });
  });

  it('mengubah status menjadi failed jika API gagal', async () => {
    api.get.mockRejectedValue(new Error('Server tidak tersedia'));

    const store = createTestStore();

    await store.dispatch(fetchThreads());

    const state = store.getState().threads;

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Server tidak tersedia');
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('menolak respons dengan format data yang tidak sesuai', async () => {
    api.get
      .mockResolvedValueOnce({ threads: 'bukan-array' })
      .mockResolvedValueOnce({ users: [] });

    const store = createTestStore();

    await store.dispatch(fetchThreads());

    const state = store.getState().threads;

    expect(state.status).toBe('failed');
    expect(state.error).toBe(
      'Format data thread atau pengguna dari API tidak sesuai.',
    );
  });
});

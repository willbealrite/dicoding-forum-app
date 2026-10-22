import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import authReducer from '../states/authSlice';
import LoginPage from './LoginPage';

function renderLoginPage(authOverrides = {}) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      threads: (state = {}) => state,
      leaderboards: (state = {}) => state,
    },
    preloadedState: {
      auth: {
        token: null,
        user: null,
        status: 'idle',
        error: null,
        ...authOverrides,
      },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('LoginPage component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('menampilkan form login dengan input email dan password', () => {
    renderLoginPage();

    expect(
      screen.getByRole('heading', { name: 'Welcome back.' }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Login' }),
    ).toBeEnabled();
  });

  it('menonaktifkan tombol dan menampilkan status saat login berlangsung', () => {
    renderLoginPage({ status: 'loading' });

    expect(
      screen.getByRole('button', { name: 'Memproses...' }),
    ).toBeDisabled();
  });

  it('menampilkan pesan error ketika login gagal', () => {
    renderLoginPage({
      status: 'failed',
      error: 'Email atau password salah',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email atau password salah',
    );
  });

  it('menerima input email dan password dari pengguna', async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.type(
      screen.getByLabelText('Email'),
      'kenken@example.com',
    );

    await user.type(
      screen.getByLabelText('Password'),
      'password123',
    );

    expect(screen.getByLabelText('Email')).toHaveValue(
      'kenken@example.com',
    );

    expect(screen.getByLabelText('Password')).toHaveValue(
      'password123',
    );
  });
});

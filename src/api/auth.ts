import { api } from './client';
import type { AuthResponse, User } from '../types/user';

export async function login(email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password, turnstileToken });
  return data;
}

export async function register(username: string, email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password, turnstileToken });
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function requestPasswordReset(email: string, turnstileToken?: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email, turnstileToken });
  return data;
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  return data;
}

export async function changeEmail(newEmail: string, password: string): Promise<User> {
  const { data } = await api.patch<User>('/users/me/email', { newEmail, password });
  return data;
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/users/me', { data: { password } });
}

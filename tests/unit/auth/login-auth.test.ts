import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Authentication: Login & Credential Verification (Area 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should succeed with valid email and password credentials', async () => {
    const mockUser = { id: 'u-101', email: 'test@studentdoc.io', role: 'USER' };
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: mockUser, session: { access_token: 'valid-jwt-token' } },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@studentdoc.io', password: 'Password@123' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe('u-101');
    expect(data.message).toBe('Logged in successfully');
  });

  it('2. should reject invalid email format (missing @)', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalidemail.com', password: 'Password@123' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Invalid email or password format');
  });

  it('3. should reject invalid email format (missing domain)', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('4. should reject password shorter than 6 characters', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@studentdoc.io', password: '123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('5. should reject empty email field', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('6. should reject empty password field', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@studentdoc.io', password: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('7. should handle incorrect password with HTTP 401 and error message', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@studentdoc.io', password: 'WrongPassword' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid login credentials');
  });

  it('8. should handle user not found error from authentication provider', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'User not found' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@studentdoc.io', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('9. should handle email not confirmed error', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Email not confirmed' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'unconfirmed@studentdoc.io', password: 'Password@123' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain('Email not confirmed');
  });

  it('10. should handle rate-limiting error from authentication server', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Too many requests' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'victim@studentdoc.io', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('11. should handle unexpected server exceptions during authentication', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockRejectedValue(new Error('Connection failure')),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@studentdoc.io', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('12. should handle malformed JSON in login request body', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: '{invalid_json',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('13. should handle uppercase email by standardizing authentication', async () => {
    const mockUser = { id: 'u-102', email: 'caps@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'CAPS@STUDENTDOC.IO', password: 'Password@123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('14. should accept special characters in password', async () => {
    const mockUser = { id: 'u-103', email: 'special@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'special@studentdoc.io', password: 'P@$$w0rd!#%^&*()_+' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

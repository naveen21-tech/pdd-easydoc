import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as registerPost } from '@/app/api/auth/register/route';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Auth API Routes (app/api/auth/)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login route should validate invalid email format and return 400', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    });

    const res = await loginPost(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Invalid email or password format');
  });

  it('login route should return 401 on incorrect credentials', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid login credentials'),
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@saveetha.com', password: 'wrongpassword' }),
    });

    const res = await loginPost(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid login credentials');
  });

  it('login route should return 200 and user object on successful authentication', async () => {
    const mockUser = { id: 'usr-123', email: 'student@saveetha.com' };
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
      body: JSON.stringify({ email: 'student@saveetha.com', password: 'validpassword123' }),
    });

    const res = await loginPost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe('usr-123');
    expect(data.message).toBe('Logged in successfully');
  });

  it('register route should validate short passwords and return 400', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Naveen', email: 'test@saveetha.com', password: '123' }),
    });

    const res = await registerPost(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('min 6 characters');
  });

  it('register route should return 200 on successful registration', async () => {
    const mockRegisteredUser = { id: 'usr-new', email: 'newuser@saveetha.com' };
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: mockRegisteredUser, session: null },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Student',
        email: 'newuser@saveetha.com',
        password: 'securepassword123',
      }),
    });

    const res = await registerPost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe('usr-new');
    expect(data.message).toContain('Registration successful');
  });
});

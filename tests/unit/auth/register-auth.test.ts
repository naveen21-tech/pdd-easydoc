import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Authentication: Registration & Account Provisioning (Area 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should successfully register a new user with valid name, email, and password', async () => {
    const mockNewUser = { id: 'usr-new-01', email: 'newstudent@saveetha.com' };
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: mockNewUser, session: null },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Naveen Kumar',
        email: 'newstudent@saveetha.com',
        password: 'SecurePassword123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe('usr-new-01');
    expect(data.message).toContain('Registration successful');
  });

  it('2. should reject registration with empty name', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        email: 'newstudent@saveetha.com',
        password: 'SecurePassword123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('3. should reject registration with 1-character name', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'A',
        email: 'newstudent@saveetha.com',
        password: 'SecurePassword123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('4. should reject registration with invalid email format', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Naveen',
        email: 'invalid-email',
        password: 'SecurePassword123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('5. should reject registration with password shorter than 6 characters', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Naveen',
        email: 'valid@saveetha.com',
        password: '12345',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('6. should reject registration when all fields are empty', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        email: '',
        password: '',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('7. should handle user already registered error from auth provider', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'User already registered' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Existing User',
        email: 'existing@saveetha.com',
        password: 'Password123',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('User already registered');
  });

  it('8. should handle weak password error from auth provider', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Password is too weak' },
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Weak Pass',
        email: 'weak@saveetha.com',
        password: 'password',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('9. should handle unexpected server exceptions during registration', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockRejectedValue(new Error('Database network timeout')),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Crash Test',
        email: 'crash@saveetha.com',
        password: 'Password123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('10. should handle registration with long user name (up to 100 characters)', async () => {
    const longName = 'Dr. Alexander Bartholomew Montgomery III Senior Research Scientist and Professor';
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-long' }, session: null },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: longName,
        email: 'prof@saveetha.com',
        password: 'LongPassword123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('11. should handle registration with UTF-8 non-ASCII characters in name', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'u-utf8' }, session: null },
          error: null,
        }),
      },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'René François Müller',
        email: 'rene@saveetha.com',
        password: 'MüllerPassword123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('12. should pass redirect URL to signUp metadata options', async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      data: { user: { id: 'u-redirect' }, session: null },
      error: null,
    });

    (createClient as any).mockReturnValue({
      auth: { signUp: signUpMock },
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Redirect Test',
        email: 'redirect@saveetha.com',
        password: 'Password123',
      }),
    });

    await POST(req);
    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'redirect@saveetha.com',
        password: 'Password123',
        options: expect.objectContaining({
          data: { name: 'Redirect Test' },
        }),
      })
    );
  });
});

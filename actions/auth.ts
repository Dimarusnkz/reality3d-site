'use server'

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';

async function verifyTurnstile(token: string) {
  if (process.env.TURNSTILE_ENABLED !== 'true') {
    return { ok: true, reason: null as any, skipped: true };
  }
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: 'missing_secret' as any };
  if (!token) return { ok: false, reason: 'missing_token' as any };

  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    undefined;

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  if (!res.ok) return { ok: false, reason: 'verify_failed' as const };

  const data = (await res.json()) as { success?: boolean };
  return { ok: !!data.success, reason: data.success ? null : ('invalid' as const) };
}

const captchaFieldSchema =
  process.env.TURNSTILE_ENABLED === 'true'
    ? z.string().min(1, 'Captcha is required')
    : z.string().optional();

const loginSchema = z.object({
  email: z.string()
    .max(30, 'Email must be at most 30 characters')
    .email('Invalid email address')
    .regex(/^[a-zA-Z0-9@._-]+$/, 'Email must contain only Latin letters'),
  password: z.string()
    .max(20, 'Password must be at most 20 characters'),
  'cf-turnstile-response': captchaFieldSchema,
});

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must be at most 30 characters'),
  email: z.string()
    .max(30, 'Email must be at most 30 characters')
    .email('Invalid email address')
    .regex(/^[a-zA-Z0-9@._-]+$/, 'Email must contain only Latin letters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(20, 'Password must be at most 20 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
  'cf-turnstile-response': captchaFieldSchema,
});

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password } = result.data;
  const captchaToken = result.data['cf-turnstile-response'];

  try {
    const captcha = await verifyTurnstile(captchaToken || '');
    if (!captcha.ok) {
      const message =
        captcha.reason === 'missing_secret'
          ? 'Сервис защиты временно недоступен'
          : 'Подтвердите, что вы не робот';
      return {
        errors: {
          captcha: [message],
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return {
        errors: {
          email: ['Invalid email or password'],
        },
      };
    }

    await createSession(user.id.toString(), user.role);
    
    if (['admin', 'manager', 'engineer', 'warehouse', 'delivery'].includes(user.role)) {
      redirect('/admin');
    } else {
      redirect('/lk');
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Login error:', error);
    return {
      errors: {
        email: [error instanceof Error ? error.message : 'An error occurred during login'],
      },
    };
  }
}

export async function register(prevState: any, formData: FormData) {
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password, name } = result.data;
  const captchaToken = result.data['cf-turnstile-response'];

  try {
    const captcha = await verifyTurnstile(captchaToken || '');
    if (!captcha.ok) {
      const message =
        captcha.reason === 'missing_secret'
          ? 'Сервис защиты временно недоступен'
          : 'Подтвердите, что вы не робот';
      return {
        errors: {
          captcha: [message],
        },
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        errors: {
          email: ['Email already in use'],
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    await createSession(user.id.toString(), 'user');
    redirect('/lk');
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Registration error:', error);
    return {
      errors: {
        email: [error instanceof Error ? error.message : 'An error occurred during registration'],
      },
    };
  }
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

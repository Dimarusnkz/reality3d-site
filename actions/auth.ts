'use server'

import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';
import { assertCsrf } from '@/lib/csrf';
import { getClientIp } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid';
import crypto from 'crypto';

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
  redirectTo: z.string().max(200).optional().nullable(),
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
  redirectTo: z.string().max(200).optional().nullable(),
});

function sanitizeRedirectTo(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  if (trimmed.length > 200) return null
  return trimmed
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const prisma = getPrisma();
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) return { errors: { csrf_token: [csrf.error] } };

  const email = formData.get('email') as string;
  if (!email || !z.string().email().safeParse(email).success) {
    return { errors: { email: ['Введите корректный Email'] } };
  }

  const ip = await getClientIp();
  const rl = await rateLimit(`auth:reset-request:${ip}`, 3, 15 * 60_000);
  if (!rl.ok) return { errors: { email: ['Слишком много запросов. Попробуйте через 15 минут.'] } };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
      select: { id: true }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    const emailRes = await sendEmailViaSendGrid({
      to: [email],
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@reality3d.ru',
      subject: 'Восстановление пароля Reality3D',
      text: `Для сброса пароля перейдите по ссылке: ${resetUrl}\n\nСсылка действительна 1 час.`,
    });

    if (!emailRes.ok) {
      console.warn('SendGrid failed or not configured. RESET URL:', resetUrl);
      // If it's a configuration issue, we still return success to the UI 
      // but the admin can see the link in the logs. 
      // However, for the user it's better to know it failed if we want them to contact support.
      // Let's check if it's "not set" vs "actual error"
      if (emailRes.error === 'SENDGRID_API_KEY not set') {
         return { success: true, debugUrl: resetUrl }; // Success but with a hint for us
      }
      throw new Error(emailRes.error);
    }

    return { success: true };
  } catch (e) {
    console.error('Reset request error:', e);
    return { errors: { email: ['Ошибка при отправке письма'] } };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const prisma = getPrisma();
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) return { errors: { csrf_token: [csrf.error] } };

  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  if (!token) return { errors: { password: ['Некорректный токен'] } };
  
  const passwordResult = z.string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(20, 'Пароль должен быть не более 20 символов')
    .regex(/[0-9]/, 'Должна быть хотя бы одна цифра')
    .regex(/[a-z]/, 'Должна быть хотя бы одна строчная буква')
    .regex(/[A-Z]/, 'Должна быть хотя бы одна заглавная буква')
    .safeParse(password);

  if (!passwordResult.success) {
    return { errors: { password: passwordResult.error.flatten().formErrors } };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true }
    });

    if (!user) {
      return { errors: { password: ['Токен недействителен или истек'] } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 }, // Invalidate all existing sessions
      },
      select: { id: true }
    });

    return { success: true };
  } catch (e) {
    console.error('Reset password error:', e);
    return { errors: { password: ['Ошибка при смене пароля'] } };
  }
}

export async function login(prevState: any, formData: FormData) {
  const prisma = getPrisma();
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) {
    return { errors: { csrf_token: [csrf.error] } };
  }

  const ip = await getClientIp();
  const emailKey = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';
  const rl = await rateLimit(`auth:login:${ip}:${emailKey}`, 5, 60_000);
  if (!rl.ok) {
    return { errors: { email: ['Слишком много попыток. Подожди минуту и попробуй снова.'] } };
  }

  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password } = result.data;
  const captchaToken = result.data['cf-turnstile-response'];
  const redirectTo = sanitizeRedirectTo(result.data.redirectTo);

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
      select: { id: true, password: true, role: true }
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
      if (redirectTo && redirectTo.startsWith('/admin')) redirect(redirectTo);
      redirect('/admin');
    } else {
      if (redirectTo && !redirectTo.startsWith('/admin')) redirect(redirectTo);
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
  const prisma = getPrisma();
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) {
    return { errors: { csrf_token: [csrf.error] } };
  }

  const ip = await getClientIp();
  const emailKey = typeof formData.get('email') === 'string' ? (formData.get('email') as string) : '';
  const rl = await rateLimit(`auth:register:${ip}:${emailKey}`, 3, 5 * 60_000);
  if (!rl.ok) {
    return { errors: { email: ['Слишком много попыток регистрации. Подожди 5 минут.'] } };
  }

  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password, name } = result.data;
  const captchaToken = result.data['cf-turnstile-response'];
  const redirectTo = sanitizeRedirectTo(result.data.redirectTo);

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
      select: { id: true }
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
      select: { id: true }
    });

    await createSession(user.id.toString(), 'user');
    if (redirectTo && !redirectTo.startsWith('/admin')) redirect(redirectTo);
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

export async function logout(formData: FormData) {
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) {
    redirect('/login');
  }

  await deleteSession();
  redirect('/login');
}

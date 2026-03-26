import { getLogMeta } from './shop/log-meta';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export async function logStructural(level: LogLevel, message: string, context: Record<string, any> = {}) {
  const meta = await getLogMeta();
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
    ...context,
  };

  // In production, we log as JSON for easier parsing by log aggregators
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    // In development, we can keep it readable but still include context
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, context);
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, any>) => logStructural('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, any>) => logStructural('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, any>) => logStructural('error', msg, ctx),
  debug: (msg: string, ctx?: Record<string, any>) => logStructural('debug', msg, ctx),
};

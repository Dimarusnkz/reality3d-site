import { getPrisma } from '@/lib/prisma';
import { getLogMeta } from './shop/log-meta';
import { logger } from './logger';

export type AuditLogInput = {
  actorUserId: number | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAudit(input: AuditLogInput) {
  const prisma = getPrisma();
  const meta = await getLogMeta();

  // 1. Save to database for UI audit trail
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target ?? null,
      metadata: input.metadata == null 
        ? JSON.stringify({ ...meta }) 
        : JSON.stringify({ ...input.metadata, ...meta }),
    },
  });

  // 2. Log to stdout for observability platforms
  await logger.info(`Audit: ${input.action}`, {
    actorId: input.actorUserId,
    target: input.target,
    auditMetadata: input.metadata,
  });
}


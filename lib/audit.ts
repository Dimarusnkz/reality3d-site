import { getPrisma } from '@/lib/prisma';

export type AuditLogInput = {
  actorUserId: number | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAudit(input: AuditLogInput) {
  const prisma = getPrisma();
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target ?? null,
      metadata: input.metadata == null ? null : JSON.stringify(input.metadata),
    },
  });
}


"use client";

import { useActionState } from "react";
import { revokeSession, revokeAllMySessions } from "@/app/actions/sessions";
import { AlertCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";

export type SessionRow = {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userAgent: string | null;
};

export function SessionsCard({ sessions, currentSessionId }: { sessions: SessionRow[]; currentSessionId: string }) {
  const [state, formAction, pending] = useActionState(revokeSession, undefined);

  return (
    <div className="neon-card p-6 rounded-xl max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Активные сессии</h2>
          <p className="text-sm text-gray-400 mt-1">Заверши подозрительные входы или выйди со всех устройств.</p>
        </div>
        <form action={revokeAllMySessions}>
          <CsrfTokenField />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Выйти везде
          </button>
        </form>
      </div>

      {state?.error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sessions.map((s) => {
          const isCurrent = s.id === currentSessionId;
          const isRevoked = !!s.revokedAt;
          return (
            <div
              key={s.id}
              className={cn(
                "rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-start justify-between gap-4",
                isRevoked && "opacity-60"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-white truncate">{isCurrent ? "Текущая сессия" : "Сессия"}</div>
                  {isRevoked ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-gray-300">Завершена</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Активна</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400 truncate">{s.userAgent || "User-Agent неизвестен"}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>
                    <div className="text-gray-500">Создана</div>
                    <div>{new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Последняя активность</div>
                    <div>{new Date(s.lastUsedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Истекает</div>
                    <div>{new Date(s.expiresAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">ID</div>
                    <div className="truncate">{s.id}</div>
                  </div>
                </div>
              </div>

              <form action={formAction}>
                <CsrfTokenField />
                <input type="hidden" name="sessionId" value={s.id} />
                <button
                  type="submit"
                  disabled={pending || isRevoked}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium border transition-all",
                    isCurrent ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15" : "border-slate-700 bg-slate-900/50 text-gray-200 hover:bg-slate-800",
                    (pending || isRevoked) && "opacity-50 pointer-events-none"
                  )}
                >
                  {isCurrent ? "Выйти" : "Завершить"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}


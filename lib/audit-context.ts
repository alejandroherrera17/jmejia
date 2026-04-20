import { AsyncLocalStorage } from "node:async_hooks";

type AuditActor = {
  userId: string;
  userName?: string | null;
};

type AuditContext = {
  actor: AuditActor | null;
};

const auditStorage = new AsyncLocalStorage<AuditContext>();

export function withAuditContext<T>(actor: AuditActor | null, callback: () => Promise<T> | T) {
  return auditStorage.run({ actor }, callback);
}

export function getAuditContext() {
  return auditStorage.getStore() ?? { actor: null };
}

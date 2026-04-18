import { randomUUID } from "node:crypto";

import {
  claimNextInvoiceEmailJob,
  markInvoiceEmailJobCompleted,
  markInvoiceEmailJobFailed
} from "@/services/email-queue-service";
import { sendInvoiceEmail } from "@/services/invoice-email-service";

const workerId = `invoice-worker-${randomUUID()}`;
const pollIntervalMs = Number(process.env.EMAIL_WORKER_POLL_MS ?? 5000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processNextJob() {
  const job = await claimNextInvoiceEmailJob(workerId);

  if (!job) {
    return false;
  }

  try {
    await sendInvoiceEmail(job.saleId);
    await markInvoiceEmailJobCompleted(job.id);
    console.log(`[${workerId}] Factura enviada para saleId=${job.saleId}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido procesando la cola de correos.";
    await markInvoiceEmailJobFailed(job.id, message);
    console.error(`[${workerId}] Error enviando saleId=${job.saleId}: ${message}`);
  }

  return true;
}

async function runWorker() {
  console.log(`[${workerId}] Worker de correo iniciado. Poll ${pollIntervalMs}ms.`);

  while (true) {
    const processed = await processNextJob();

    if (!processed) {
      await sleep(pollIntervalMs);
    }
  }
}

void runWorker().catch((error) => {
  console.error(`[${workerId}] Worker detenido por error fatal:`, error);
  process.exit(1);
});

"use server";

import { FieldValue } from "firebase-admin/firestore";

import type { DiagnosticRun } from "@/lib/types";

import { getAdminDb } from "./firebase-admin";

const DIAGNOSTIC_COLLECTION = "code";

export async function saveDiagnosticRun(
  run: Omit<DiagnosticRun, "runId" | "createdAt">,
): Promise<DiagnosticRun | null> {
  try {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = Date.now();
    const newRun: DiagnosticRun = {
      ...run,
      runId,
      createdAt,
    };

    await getAdminDb()
      .collection(DIAGNOSTIC_COLLECTION)
      .doc(runId)
      .set({
        ...JSON.parse(JSON.stringify(newRun)),
        createdAt,
        createdAtServer: FieldValue.serverTimestamp(),
      });

    return newRun;
  } catch (error) {
    console.error("Error saving diagnostic run:", error);
    return null;
  }
}

/**
 * Script: mint-portal-token.ts
 *
 * Dev helper to design the client portal against REAL data. Mints a genuine
 * `portalAccess` token (via the same `createContractPortalAccess` the app uses)
 * for an already-sent contract, then prints the portal URL to open.
 *
 * It does NOT move or modify the contract — it only adds a token-gated pointer.
 *
 * Usage (run from apps/dashboard):
 *   npm run mint:portal               # picks the most recently sent contract
 *   npm run mint:portal -- <contractId>   # targets a specific contract
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY (loaded from .env.local by the npm
 * script). The minted link is dev-only; let it expire or revoke it when done.
 */

import fs from "node:fs";
import path from "node:path";

import type { Client, Contract } from "@/lib/types";
import { normalizePhone } from "@/lib/utils";
import { getAdminDb } from "@/server/firebase-admin";
import { createContractPortalAccess } from "@/server/portal";

/**
 * Minimal .env.local loader (no dotenv dep). Safe because firebase-admin reads
 * the service-account key lazily — only when getAdminDb() first runs, well after
 * this executes.
 */
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

/** Statuses that carry a frozen lockedSnapshot the portal can render. */
const SENT_STATUSES = ["sent", "viewed", "fully_executed"];

async function findContract(contractId?: string): Promise<Contract | null> {
  const db = getAdminDb();

  if (contractId) {
    const snap = await db.collection("contracts").doc(contractId).get();
    return snap.exists ? (snap.data() as Contract) : null;
  }

  // No id given: pick the most recently updated sent contract with a snapshot.
  const snap = await db
    .collection("contracts")
    .where("status", "in", SENT_STATUSES)
    .get();
  const candidates = snap.docs
    .map((d) => d.data() as Contract)
    .filter((c) => c.lockedSnapshot)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return candidates[0] ?? null;
}

async function main() {
  const contractId = process.argv[2];
  const contract = await findContract(contractId);

  if (!contract) {
    console.error(
      contractId
        ? `❌ No contract found with id "${contractId}".`
        : "❌ No sent contract with a locked snapshot was found. Send a contract first.",
    );
    process.exit(1);
  }
  if (!contract.lockedSnapshot) {
    console.error(
      `❌ Contract "${contract.contractId}" has no lockedSnapshot — only sent contracts can be portal-linked.`,
    );
    process.exit(1);
  }

  const sentToEmail =
    contract.lockedSnapshot.parties.clientEmail || "preview@local.test";

  // The portal now gates on the client's phone last-4. Pull it from the client
  // record so the minted link is verifiable; fall back to 0000 for dev data
  // without a phone. The digits to type are printed below.
  const clientSnap = await getAdminDb()
    .collection("clients")
    .doc(contract.clientId)
    .get();
  const client = clientSnap.data() as Client | undefined;
  const phoneDigits = normalizePhone(client?.phone ?? "");
  const phoneLast4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "0000";

  const { portalAccessId, accessToken } = await createContractPortalAccess({
    contract,
    sentToEmail,
    phoneLast4,
  });

  const path = `/portal/${accessToken}/contract/${contract.contractId}`;

  console.log("\n✅ Portal access minted.\n");
  console.log(`   Contract:       ${contract.title} (${contract.contractId})`);
  console.log(`   Status:         ${contract.status}`);
  console.log(`   portalAccessId: ${portalAccessId}`);
  console.log(`   Verify with:    ${phoneLast4} (last 4 of client phone)`);
  console.log("\n   Open in the browser:\n");
  // Sarvian branding only resolves on the sarvian host (see app-config.ts); add
  // `127.0.0.1 app.sarviandg.local` to your hosts file to see it locally.
  console.log(`   • Sarvian brand:  http://app.sarviandg.local:3000${path}`);
  console.log(`   • Default brand:  http://localhost:3000${path}\n`);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Failed to mint portal token:", error);
  process.exit(1);
});

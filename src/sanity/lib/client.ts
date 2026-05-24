// sanity/lib/client.ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

if (!projectId || !dataset || !apiVersion) {
  throw new Error("Missing SANITY env vars (projectId/dataset/apiVersion).");
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production", // Live data in dev, cached reads in prod
});

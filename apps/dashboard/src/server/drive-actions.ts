"use server";

import { google } from "googleapis";

import { Readable } from "node:stream";

/**
 * Next.js Server Action that receives binary file data inside a FormData object,
 * authenticates with Google Drive using a Service Account JWT, streams the file,
 * creates permissions to make it shareable, and returns the direct-render image URL.
 */
export async function uploadToGoogleDrive(formData: FormData): Promise<string> {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google Drive credentials (GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY) are not fully configured in your .env.local.",
    );
  }

  try {
    // Authenticate with Google Drive JWT
    const formattedKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Stream the binary data from ArrayBuffer into a Node-compliant Readable stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaStream = new Readable();
    mediaStream.push(buffer);
    mediaStream.push(null);

    // Build standard folder-scoped file metadata
    const fileMetadata: {
      name: string;
      parents?: string[];
    } = {
      name: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
    };
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Upload to drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: file.type,
        body: mediaStream,
      },
      fields: "id",
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error(
        "Failed to upload file to Google Drive (no fileId returned).",
      );
    }

    // Set permission to make it shareable to anyone with the link
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Converted direct-embed URL format for Google Drive hosted images
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Google Drive API Stream Upload Error:", error);
    throw new Error(`Google Drive upload failed: ${errMsg}`);
  }
}

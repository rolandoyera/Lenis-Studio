# Architectural Review: Image Structure & Deletion Strategy

## 1. The Verdict
The proposed `{ url, path }` schema structure is **architecturally clean and standard**, but the **effort-to-benefit ratio makes a full schema refactoring hard to justify** given how the Firebase Storage SDK works. 

Instead of restructuring the entire database schema and all UI code components, a **hybrid approach** is recommended: **keep the database properties as simple strings, but use a helper to resolve storage paths from URLs for deletion.**

---

## 2. Why the `{ url, path }` Schema Refactor Has High Friction
Restructuring properties from simple `string` URLs to nested objects (`logo: { url, path }`) has a massive cascade effect across the application. 

You would need to refactor:
1. **Types**: Update the `Client`, `Vendor`, `LibraryItem`, and `ProposalLineItem` interfaces.
2. **Components**: Rewrite all image rendering code (`VendorCard`, `LibraryCard`, detail pages, gallery carousel widgets) to access `item.coverImage.url` rather than `item.coverImageUrl`.
3. **Forms**: Re-configure all Zod validation schemas (`zodResolver`), React Hook Form fields, and custom form inputs.
4. **Mock Data**: Re-seed database entries so fields match the new schemas.
5. **AI Image Mirroring**: Re-write the server actions and client helpers that mirror external images to return the new nested objects instead of simple strings.

---

## 3. The Clean Alternative: Leverage the Firebase SDK
The Firebase Client Web SDK already supports resolving a full HTTP download URL directly into a Storage reference using the `ref` function. 

You can call:
```typescript
import { ref, deleteObject } from "firebase/storage";

// The SDK automatically parses the path out of the download URL
const storageRef = ref(storage, downloadUrl);
await deleteObject(storageRef);
```

### Explicit URL Parser Helper (Optional)
If you prefer to be 100% explicit and avoid relying on the SDK's internal parsing, you can write a simple, robust helper function to decode the path from the Firebase URL:

```typescript
export function getStoragePathFromUrl(url: string): string | null {
  const firebaseStoragePrefix = "https://firebasestorage.googleapis.com/v0/b/";
  if (!url.startsWith(firebaseStoragePrefix)) return null;

  // The path starts after '/o/' and ends before query params ('?')
  const parts = url.split("/o/");
  if (parts.length < 2) return null;

  const rawPath = parts[1].split("?")[0];
  return decodeURIComponent(rawPath); // e.g. "library/123_image.jpg"
}
```

---

## 4. Recommended Plan of Action

Keep your Firestore schema simple (using strings) and add a direct client-side cleanup flow when deleting items:

1. **Keep the Firestore properties as simple strings** (`logoUrl`, `coverImageUrl`, `imageUrls`).
2. **Add a cleanup helper** to `src/lib/db.ts`:
   ```typescript
   import { ref, deleteObject } from "firebase/storage";
   import { storage } from "./firebase";

   export async function deleteStorageFile(url: string): Promise<void> {
     if (!url.includes("firebasestorage.googleapis.com")) return;
     try {
       // Let the SDK resolve the storage path from the URL
       const fileRef = ref(storage, url);
       await deleteObject(fileRef);
     } catch (error) {
       console.error(`Failed to delete storage file: ${url}`, error);
     }
   }
   ```
3. **Update Deletion Functions in `db.ts`**:
   ```typescript
   export async function deleteLibraryItem(item: LibraryItem): Promise<void> {
     // 1. Gather all Firebase URLs
     const urls = [item.coverImageUrl, ...(item.imageUrls || [])].filter(Boolean);

     // 2. Clean them up from Storage
     await Promise.all(urls.map(url => deleteStorageFile(url)));

     // 3. Delete the Firestore Doc
     await deleteDoc(doc(db, "library", item.itemId));
   }
   ```

This approach gives you **100% of the cleanup capability** with **zero schema changes** and can be implemented in a few minutes.

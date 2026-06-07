1. I would update your image structure now so every uploaded image saves:

```ts
{
    url: "...",
    path: "vendors/vendorId/logo.jpg"
}
```

Instead of only:

```ts
{
  logoUrl: "...";
}
```

2. For vendors:

```ts
{
    logo: {
        url: "...",
        path: "vendors/vendorId/logo.jpg"
    },
    heroImage: {
        url: "...",
        path: "vendors/vendorId/hero.jpg"
    }
}
```

3. For library items:

```ts
{
    coverImage: {
        url: "...",
        path: "library/itemId/cover.jpg"
    },
    images: [
        {
            url: "...",
            path: "library/itemId/images/image-1.jpg"
        }
    ]
}
```

4. Then deletes become simple and reliable:

```ts
await deleteObject(ref(storage, vendor.logo.path));
await deleteObject(ref(storage, vendor.heroImage.path));
await deleteDoc(doc(db, "vendors", vendor.id));
```

Since the app is still in development and there are only a couple image records, refactor the image fields now. Store both the Firebase download URL and the Firebase Storage path for every uploaded image. Do this for vendor logo, vendor hero image, library cover image, and library gallery images. Then update the delete logic to delete Storage objects by path before deleting the Firestore document. Do not rely on parsing Firebase URLs except as a temporary fallback for existing records.

# Organization Settings / Company Profile

## Goal

Create a new **Organization Settings / Company Profile** section for each tenant.

This data belongs to the organization itself (not individual users) and will later be used for:

- Proposals
- Invoices
- Reports
- PDF exports
- Client-facing proposal pages
- Email templates
- Organization branding throughout the app

---

## Firestore Structure

Store the following fields directly on the existing organization document.

Do **not** create a new collection or subcollection.

```ts
organizations/{organizationId}
{
  companyProfile: {
    displayName: string;
    legalName?: string;

    email?: string;
    phone?: string;
    website?: string;

    logoUrl?: string;
    logoPath?: string;

    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      formatted?: string;
    };

    social: {
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      houzz?: string;
    };
  };

  branding: {
    primaryColor?: string;
    accentColor?: string;

    logoLightUrl?: string;
    logoLightPath?: string;

    logoDarkUrl?: string;
    logoDarkPath?: string;

    iconLightUrl?: string;
    iconLightPath?: string;

    iconDarkUrl?: string;
    iconDarkPath?: string;
  };

  settings: {
    timezone?: string;
    currency?: string;
    measurementUnit?: "imperial" | "metric";

    defaultMarkupPercent?: number;
    defaultTaxRate?: number;
    proposalExpirationDays?: number;
  };
}
```

## Firebase Storage Structure

Use Firebase Storage for branding assets.

```ts
organizations / { organizationId } / branding / logo.webp;
organizations / { organizationId } / branding / logo - light.webp;
organizations / { organizationId } / branding / logo - dark.webp;
organizations / { organizationId } / branding / icon - light.webp;
organizations / { organizationId } / branding / icon - dark.webp;
```

Store both:

```ts
logoUrl;
logoPath;
```

Follow the same upload/replacement/deletion pattern already used for Vendors and Library Items so old files can be removed when assets are replaced.

## UI Requirements

Create a Company Profile page under /dashboard/company/page.tsx.

Company Information

Fields:

    - Company Name
    - Legal Name
    - Email
    - Phone
    - Website
    - Address

Fields:

    - Address Line 1
    - Address Line 2
    - City
    - State / Province
    - Postal Code
    - Country

Generate and store a formatted address string automatically.

Social Profiles

Fields:

    - Instagram
    - Facebook
    - LinkedIn
    - Houzz

    Branding

Fields:

    - Company Logo Upload
    - Primary Brand Color
    - Accent Color

## Technical Requirements

    - Reuse existing upload helpers and Firestore patterns already used in Vendors.
    - Reuse existing image deletion logic.
    - Use optimistic updates where appropriate.
    - Run cleanUndefined() before saving.

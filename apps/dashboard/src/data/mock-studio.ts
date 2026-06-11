import type { Client, LibraryItem, Project, ProjectRoom, ProjectRoomItem, Vendor } from "@/lib/types";

{
  /* THIS PAGE IS ONLY FOR TESTING DESIGN CONCEPTS AND YOU SHOULD NOT FOLLOW OR COPY ANY OF THE STRUCTURE BELOW  */
}

export const mockVendors: Vendor[] = [
  {
    vendorId: "v-arteriors",
    organizationId: "org-demo",
    name: "Arteriors Showroom",
    website: "https://www.arteriorshome.com",
    repName: "Diana Prince",
    repEmail: "diana.prince@arteriorshome.com",
    repPhone: "(555) 019-2834",
    notes: "Trade-only lighting and luxury accessories showroom. 20% designer discount.",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    vendorId: "v-viola",
    organizationId: "org-demo",
    name: "Calacatta Marble & Co",
    website: "https://www.calacattaviola.example.com",
    repName: "Marco Rossi",
    repEmail: "m.rossi@calacattaviola.com",
    repPhone: "(555) 014-9988",
    notes: "Direct importer of Carrara and Calacatta viola slabs. Excellent quality, fast dispatch.",
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
  },
  {
    vendorId: "v-rh",
    organizationId: "org-demo",
    name: "RH Modern",
    website: "https://www.restorationhardware.com",
    repName: "Sarah Connor",
    repEmail: "sconnor@rh.com",
    repPhone: "(555) 012-4433",
    notes: "High-end contemporary residential furniture. Standard designer trade pricing program.",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
];

export const mockClients: Client[] = [
  {
    uid: "c-sophia",
    organizationId: "org-demo",
    firstName: "Sophia",
    lastName: "Loren",
    email: "sophia.loren@luxurymail.com",
    phone: "(555) 902-1000",
    company: "Loren Estate & Film Corp",
    taxId: "12-3456789",
    taxable: true,
    street: "100 Hollywood Blvd, Suite 400",
    city: "Los Angeles",
    state: "CA",
    zip: "90028",
    notes: "High-profile client with meticulous taste for premium Italian stones and minimalist warm interiors.",
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    uid: "c-arthur",
    organizationId: "org-demo",
    firstName: "Arthur",
    lastName: "Pendragon",
    email: "arthur.king@camelotholdings.com",
    phone: "(555) 762-9980",
    company: "Camelot Development Group",
    taxId: "98-7654321",
    taxable: true,
    street: "24 Camelot Way",
    city: "Newport",
    state: "RI",
    zip: "02840",
    notes: "Wants a complete renovation of a coastal Tudor estate. Heavy timber elements and grand lighting.",
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
];

export const mockProjects: Project[] = [
  {
    projectId: "p-loren-malibu",
    organizationId: "org-demo",
    clientId: "c-sophia",
    name: "Malibu Beachside Penthouse",
    address: "24000 Pacific Coast Hwy, Malibu, CA 90265",
    street: "24000 Pacific Coast Hwy",
    city: "Malibu",
    state: "CA",
    zip: "90265",
    sameAsMain: false,
    status: "Active",
    budget: 450000,
    notes:
      "Modern airy aesthetic, focusing heavily on warm limestone, custom viola marble fireplaces, and custom gold lighting.",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    projectId: "p-king-tudor",
    organizationId: "org-demo",
    clientId: "c-arthur",
    name: "Camelot Coastal Estate Manor",
    address: "100 Ocean Drive, Newport, RI 02840",
    street: "100 Ocean Drive",
    city: "Newport",
    state: "RI",
    zip: "02840",
    sameAsMain: false,
    status: "Active",
    budget: 1200000,
    notes:
      "Renovation of the grand hall, master bedroom suite, and external conservatory. Historic character preservation.",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
];

export const mockLibraryItems: LibraryItem[] = [
  {
    itemId: "item-9dmrz1499",
    organizationId: "org-demo",
    name: "Astor Bed",
    costType: "Product",
    category: "Furniture",
    subcategory: "Beds",
    vendorId: "vendor-47civmjgm",
    sku: "45ASTCQNKT",
    description:
      "Celebrating craftsmanship with chic style, our Astor Collection features gorgeous reeded detailing and inset stone tops on case pieces. Offering timeless sophistication with its uniquely crafted curves, Astor creates a suite designed for dreaming.",
    unitType: "Each",
    finishColor: "Chestnut",
    sourcingLink: "https://www.arhaus.com/products/astor-bed?variant=44667236286635",
    manufacturer: "Arhaus",
    materials: "Oak veneers, solid oak wood",
    dimensions: '65.5" W x 85.5" D x 48" H',
    internalNote: "",
    poDescription: "",
    taxable: true,
    unitCost: 4500,
    msrp: 5300,
    markup: 15,
    sellingPrice: 5175,
    coverImagePath: "library/item-9dmrz1499/cover.jpg",
    coverImageUrl:
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fcover.jpg?alt=media&token=fea806f8-a217-400e-ac04-b473dea558b2",
    imageUrls: [
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fcover.jpg?alt=media&token=fea806f8-a217-400e-ac04-b473dea558b2",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-3sgqeh37z.jpg?alt=media&token=0840b813-cde6-40a5-81c7-7d872a020f0b",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-gdmevu5z8.jpg?alt=media&token=92a2ad60-0c27-4636-a97e-a3353fecbc83",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-zh6317tap.jpg?alt=media&token=821cee81-3ee3-4593-9a28-c44b0a546160",
    ],
    images: [
      {
        path: "library/item-9dmrz1499/cover.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fcover.jpg?alt=media&token=fea806f8-a217-400e-ac04-b473dea558b2",
      },
      {
        path: "library/item-9dmrz1499/images/img-3sgqeh37z.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-3sgqeh37z.jpg?alt=media&token=0840b813-cde6-40a5-81c7-7d872a020f0b",
      },
      {
        path: "library/item-9dmrz1499/images/img-gdmevu5z8.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-gdmevu5z8.jpg?alt=media&token=92a2ad60-0c27-4636-a97e-a3353fecbc83",
      },
      {
        path: "library/item-9dmrz1499/images/img-zh6317tap.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fimages%2Fimg-zh6317tap.jpg?alt=media&token=821cee81-3ee3-4593-9a28-c44b0a546160",
      },
    ],
    manualImageUrls: [],
    updatedAt: 1780938796171,
  },
  {
    itemId: "item-j3wlehve4",
    organizationId: "org-demo",
    name: "Norah Dining Chair",
    costType: "Product",
    category: "Furniture",
    subcategory: "Seating",
    vendorId: "vendor-47civmjgm",
    sku: "30NRHNMDSNO",
    description:
      "Norah is upholstered in soft, textured performance fabric to withstand the spills and stains of everyday living.",
    unitType: "Each",
    finishColor: "Nomad Snow",
    sourcingLink: "https://www.arhaus.com/products/norah-dining-chair?variant=42007288119467",
    manufacturer: "Arhaus",
    materials: "Merino Pearl Performance Fabric",
    dimensions: '25.5" W x 25.5" D x 32.25" H',
    internalNote: "",
    poDescription: "",
    taxable: true,
    unitCost: 620,
    msrp: 620,
    markup: 0,
    sellingPrice: 620,
    coverImagePath: "library/item-j3wlehve4/cover.jpg",
    coverImageUrl:
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fcover.jpg?alt=media&token=92e52cd7-7c62-471c-b8cc-33d84ecc3673",
    imageUrls: [
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fcover.jpg?alt=media&token=92e52cd7-7c62-471c-b8cc-33d84ecc3673",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-2mzm03eaj.jpg?alt=media&token=73eef5e-6864-41bc-aba8-3a461b3ae42a",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-fch296at7.jpg?alt=media&token=bd5c86c3-45de-439d-a532-92f614a64127",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-qv3xhhgcv.jpg?alt=media&token=cf3b4208-c469-472f-908f-42f52bb5632a",
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-meh4gozp9.jpg?alt=media&token=a3e93381-ba10-4e70-998d-e4a3bb3e710",
    ],
    images: [
      {
        path: "library/item-j3wlehve4/cover.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fcover.jpg?alt=media&token=92e52cd7-7c62-471c-b8cc-33d84ecc3673",
      },
      {
        path: "library/item-j3wlehve4/images/img-2mzm03eaj.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-2mzm03eaj.jpg?alt=media&token=73eef5e-6864-41bc-aba8-3a461b3ae42a",
      },
      {
        path: "library/item-j3wlehve4/images/img-fch296at7.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-fch296at7.jpg?alt=media&token=bd5c86c3-45de-439d-a532-92f614a64127",
      },
      {
        path: "library/item-j3wlehve4/images/img-qv3xhhgcv.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-qv3xhhgcv.jpg?alt=media&token=cf3b4208-c469-472f-908f-42f52bb5632a",
      },
      {
        path: "library/item-j3wlehve4/images/img-meh4gozp9.jpg",
        url: "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fimages%2Fimg-meh4gozp9.jpg?alt=media&token=a3e93381-ba10-4e70-998d-e4a3bb3e710",
      },
    ],
    manualImageUrls: [],
    updatedAt: 1780938512735,
  },
];

export const templateMockRooms: Array<Pick<ProjectRoom, "name" | "description">> = [
  {
    name: "Living Room",
    description: "Spacious area overlooking the ocean with limestone fireplace.",
  },
  {
    name: "Kitchen",
    description: "Warm minimalist layout with custom Calacatta viola marble island.",
  },
  {
    name: "Master Bedroom",
    description: "Main suite featuring soft lighting and walnut built-ins.",
  },
];

export const templateMockRoomItems: Array<
  Omit<ProjectRoomItem, "roomItemId" | "roomId" | "projectId" | "createdAt" | "updatedAt"> & { roomName: string }
> = [
  {
    roomName: "Living Room",
    organizationId: "org-demo",
    libraryItemId: "item-j3wlehve4",
    name: "Norah Dining Chair",
    costType: "Product" as const,
    category: "Furniture",
    subcategory: "Seating",
    sku: "30NRHNMDSNO",
    description:
      "Norah is upholstered in soft, textured performance fabric to withstand the spills and stains of everyday living.",
    unitType: "Each" as const,
    finishColor: "Nomad Snow",
    sourcingLink: "https://www.arhaus.com/products/norah-dining-chair?variant=42007288119467",
    manufacturer: "Arhaus",
    materials: "Merino Pearl Performance Fabric",
    dimensions: '25.5" W x 25.5" D x 32.25" H',
    taxable: true,
    unitCost: 620,
    msrp: 620,
    markup: 0,
    sellingPrice: 620,
    coverImagePath: "library/item-j3wlehve4/cover.jpg",
    coverImageUrl:
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fcover.jpg?alt=media&token=92e52cd7-7c62-471c-b8cc-33d84ecc3673",
    imageUrls: [
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-j3wlehve4%2Fcover.jpg?alt=media&token=92e52cd7-7c62-471c-b8cc-33d84ecc3673",
    ],
    quantity: 6,
  },
  {
    roomName: "Master Bedroom",
    organizationId: "org-demo",
    libraryItemId: "item-9dmrz1499",
    name: "Astor Bed",
    costType: "Product" as const,
    category: "Furniture",
    subcategory: "Beds",
    sku: "45ASTCQNKT",
    description:
      "Celebrating craftsmanship with chic style, our Astor Collection features gorgeous reeded detailing and inset stone tops on case pieces. Offering timeless sophistication with its uniquely crafted curves, Astor creates a suite designed for dreaming.",
    unitType: "Each" as const,
    finishColor: "Chestnut",
    sourcingLink: "https://www.arhaus.com/products/astor-bed?variant=44667236286635",
    manufacturer: "Arhaus",
    materials: "Oak veneers, solid oak wood",
    dimensions: '65.5" W x 85.5" D x 48" H',
    taxable: true,
    unitCost: 4500,
    msrp: 5300,
    markup: 15,
    sellingPrice: 5175,
    coverImagePath: "library/item-9dmrz1499/cover.jpg",
    coverImageUrl:
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fcover.jpg?alt=media&token=fea806f8-a217-400e-ac04-b473dea558b2",
    imageUrls: [
      "https://firebasestorage.googleapis.com/v0/b/sarvian-design-group-db.firebasestorage.app/o/library%2Fitem-9dmrz1499%2Fcover.jpg?alt=media&token=fea806f8-a217-400e-ac04-b473dea558b2",
    ],
    quantity: 1,
  },
];

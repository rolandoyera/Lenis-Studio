# Issues

1. Deleting a vendor is possible when library items are still attached to the vendor. This shows-up as "Unknown Vendor" when a vendor is deleted then viewing the items in the library or library items section. We need to make sure that the Vendor is the parent document in the database and items are the child documents, or, attached in some way. The way it is now is the vendor and items are independent documents. The vendor doesnt know about the items and the items dont know about the vendor. We need to make them related. This will eliminate the "Unknown Vendor" issue. The user can be notified before deleting the vendor, that there are items attached to the vendor, and if the user wants to delete the items as well, or, move them to another vendor. This will also prevent accidental deletion of vendors with items. This is the reason why there is a "Quick Add" in the library items add form.

2.

# Features to add to the app

1. Sub-categories in the library
   a. We have categories like "Furniture", "Appliances", "Electronics", etc.
   b. We need sub-categories like "Tables", "Chairs", "Beds", "Sofas", etc.

2. Subcontractors page: We need a page for subcontractors.

   Subcontractor Categories

   a. General Contractor
   b. Electrician
   c. Plumbing
   d. Paint
   e. Millwork
   f. Cabinetry
   g. Stone
   h. Tile
   i. Flooring
   j. Wallpaper
   k. Upholstery
   l. Metal
   m. Landscaping
   n. AV / Smart Home
   o. Glass & Mirror
   p. Other

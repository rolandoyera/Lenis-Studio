# Features for the project Selections Tab

This section will help the user begin to create rooms for their project. They can add items from the library into a room for organization. For example, they can create a room for the kitchen and add all the kitchen items into that room. These items should detach from the library items in the database to allow for edits for the specific client project. If something is edited in the Selections Tab for a specific project, it should not affect the library items and vice versa. This way if someone is working on a project, they can make changes to the items in the room without affecting the library items, or vice versa.

The user should be able to add new items to the room from this page which will not be added to the library items, or if they choose, they can add the item to the library items by selecting a checkbox while adding the item. By default, it should not. The form should be the same form used in the Library Items page.

The items in the room will prepopulate the proposal line items in the proposal page (to be designed later) when the user is ready to create one.

1. Room Creation
   - Users can create rooms for their project in the Selections tab. The page should start with a single box that says "Create a Room" which allows the user to create a room. The Selections page should be in a 3 grid format and when a room is created another box should appear to continue adding rooms. Once the room is created a button should display saying "add items" to that specific room.
   - Rooms should have a name (e.g., "Living Room", "Kitchen"). Room names may duplicate so specific id's should be assigned to each room to distinguish between them. This is used for organization only and does not affect the room items. Room id's will not be visible to the user.
   - Rooms can have an optional description.
   - Rooms are specific to a project and are not shared between projects.
   - The user can create as many rooms as they want, but the Selections page should be in a 3 grid format so if the user creates more than 3 rooms, they will need to scroll to see all the rooms. The user can edit and delete rooms.
   - The Selections page should have a "Add Rooms" button at the top which will allow the user to add rooms to the page.
   - At least one room needs to be created to add items to the project.

2. Adding Items to Rooms
   - Users can add items from the library to rooms.
   - When an item is added to a room, it becomes a separate instance of that item for that specific project.
   - This means the item in the room can be edited without affecting the original library item.
   - Items can be moved between rooms.
   - Items can be removed from rooms.

3. Detaching from Library
   - When an item is added to a room, it is no longer linked to the library item in a way that changes in the library affect the room item.
   - However, the room item should retain all the original properties of the library item (name, price, specifications, images, etc.).
   - The room item should have a reference to the original library item for easy access and reference.

4. Editing Room Items
   - Users can edit items within a room.
   - Editing an item in a room should only affect that specific instance of the item in that room.
   - The original library item should remain unchanged.
   - This allows for customization of items for specific client projects (e.g., changing the price, adding project-specific notes, etc.).

5. Room Item Properties
   - Room items should have all the properties of the original library item, including:
     - Name
     - Description
     - Category
     - Sub-category (if applicable)
     - Base price
     - Vendor
     - Images
     - Notes
     - Specifications
   - Room items can have additional properties specific to the project, such as:
     - User-defined name (if different from library name)
     - Custom description
     - Adjusted price
     - Custom specifications
     - Project-specific notes
     - Status (e.g., Selected, Ordered, Delivered, Installed)
     - Quantity

6. User Experience Flow
   - The user navigates to the Selections tab of a project.
   - The user sees a list of rooms for the project.
   - The user can create a new room by clicking a "Create Room" button.
   - The user can view the items in each room by clicking on the room name.
   - When adding an item to a room, the user can search or browse the library.
   - Once an item is added to a room, it is displayed in the room's item list.
   - The user can click on an item in the room to view and edit its details.
   - The user can drag and drop items between rooms to reorganize them.
   - When ready to create a proposal, the user clicks a "Create Proposal" button.
   - A list of rooms and their items is displayed, allowing the user to select which items to include in the proposal.
   - The selected items are then added as line items to the proposal.
   - The user can continue to edit the room items even after they have been added to a proposal.

7. Data Model Considerations
   - ProjectRooms collection: To store room information for each project.
     - Fields: roomId, projectId, name, description, createdAt, updatedAt, createdBy, updatedBy
   - ProjectRoomItems collection: To store items within each room.
     - Fields: roomItemId, room, projectId, libraryItemId (reference to library item), updatedAt, createdBy, updatedBy, and all the original properties of the library item.
   - Each ProjectRoomItem document would have a reference to its parent ProjectRoom document.
   - Each ProjectRoomItem document could also have a reference to the original LibraryItem document (if it was added from the library).

8. Future Enhancements
   - Ability to add custom item types that are not in the library.
   - Different views for rooms (e.g., grid view, list view, floor plan view).
   - Room-specific budgets and tracking.
   - Drag-and-drop reordering of items within a room.
   - Bulk editing of room items.
   - Emailing room layouts or item selections to clients.
   - Mobile-friendly interface for on-site selection viewing and editing.

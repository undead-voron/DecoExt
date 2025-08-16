---
title: Bookmarks Decorators
---

# Bookmarks Decorators

The Bookmarks decorators allow you to easily respond to browser bookmark events in your extension services. These decorators provide a clean way to handle bookmark creation, updates, and deletions.

## Method Decorators

### onBookmarkCreated

This decorator handles events that fire when a bookmark is created.

```typescript
import { onBookmarkCreated, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkCreated()
  handleNewBookmark(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) {
    console.log(`New bookmark created with ID: ${arg.id}`);
    console.log(`Title: ${arg.bookmark.title}`);
    console.log(`URL: ${arg.bookmark.url}`);
  }
}
```

With parameter decorators:

```typescript
import { onBookmarkCreated, bookmarkId, bookmarkNode, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkCreated()
  handleNewBookmark(
    @bookmarkId() id: string,
    @bookmarkNode('title') title: string,
    @bookmarkNode('url') url: string
  ) {
    console.log(`New bookmark: "${title}" (${url})`);
    console.log(`ID: ${id}`);
  }
}
```

### onBookmarkChanged

This decorator handles events that fire when a bookmark is updated.

```typescript
import { onBookmarkChanged, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkChanged()
  handleBookmarkUpdate(arg: { 
    id: string, 
    changeInfo: browser.Bookmarks.OnChangedChangeInfoType 
  }) {
    console.log(`Bookmark updated with ID: ${arg.id}`);
    
    if (arg.changeInfo.title) {
      console.log(`New title: ${arg.changeInfo.title}`);
    }
    
    if (arg.changeInfo.url) {
      console.log(`New URL: ${arg.changeInfo.url}`);
    }
  }
}
```

With parameter decorators:

```typescript
import { onBookmarkChanged, bookmarkChangedId, bookmarkChangeInfo, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkChanged()
  handleBookmarkUpdate(
    @bookmarkChangedId() id: string,
    @bookmarkChangeInfo('title') newTitle: string,
    @bookmarkChangeInfo('url') newUrl: string
  ) {
    console.log(`Bookmark ${id} was updated`);
    
    if (newTitle) {
      console.log(`Title changed to: ${newTitle}`);
    }
    
    if (newUrl) {
      console.log(`URL changed to: ${newUrl}`);
    }
  }
}
```

### onBookmarkMoved

This decorator handles events that fire when a bookmark is moved to a different location in the bookmark tree.

```typescript
import { onBookmarkMoved, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkMoved()
  handleBookmarkMove(arg: { 
    id: string, 
    moveInfo: browser.Bookmarks.OnMovedMoveInfoType 
  }) {
    console.log(`Bookmark moved: ${arg.id}`);
    console.log(`Old parent folder: ${arg.moveInfo.oldParentId}`);
    console.log(`New parent folder: ${arg.moveInfo.parentId}`);
    console.log(`Old index: ${arg.moveInfo.oldIndex}`);
    console.log(`New index: ${arg.moveInfo.index}`);
  }
}
```

With parameter decorators:

```typescript
import { onBookmarkMoved, bookmarkMovedId, bookmarkMoveInfo, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkMoved()
  handleBookmarkMove(
    @bookmarkMovedId() id: string,
    @bookmarkMoveInfo('oldParentId') oldFolder: string,
    @bookmarkMoveInfo('parentId') newFolder: string
  ) {
    console.log(`Bookmark ${id} moved from folder ${oldFolder} to ${newFolder}`);
  }
}
```

### onBookmarkRemoved

This decorator handles events that fire when a bookmark or folder is removed.

```typescript
import { onBookmarkRemoved, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkRemoved()
  handleBookmarkRemoval(arg: {
    id: string,
    removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType
  }) {
    console.log(`Bookmark removed: ${arg.id}`);
    console.log(`Parent folder: ${arg.removeInfo.parentId}`);
    console.log(`Index: ${arg.removeInfo.index}`);
    
    if (arg.removeInfo.node) {
      console.log(`Title: ${arg.removeInfo.node.title}`);
      console.log(`Was folder: ${!arg.removeInfo.node.url}`);
    }
  }
}
```

With parameter decorators:

```typescript
import { onBookmarkRemoved, bookmarkRemovedId, bookmarkRemoveInfo, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkRemoved()
  handleBookmarkRemoval(
    @bookmarkRemovedId() id: string,
    @bookmarkRemoveInfo('parentId') parentFolder: string,
    @bookmarkRemoveInfo('node') node?: browser.Bookmarks.BookmarkTreeNode
  ) {
    const itemType = node && node.url ? 'bookmark' : 'folder';
    console.log(`${itemType} "${node?.title}" was removed from folder ${parentFolder}`);
  }
}
```

## Filtering Events

All bookmark decorators support an optional `filter` parameter that allows you to conditionally handle events. The filter function receives the same arguments as your decorated method and should return `true` to proceed with handling the event, or `false` to skip it.

**⚡ Performance Benefit:** When a filter returns `false` (or `Promise<false>`), the decorated class instance is **not created at all**, significantly reducing memory usage and improving performance by avoiding unnecessary object instantiation and initialization.

**🔒 Scope Limitation:** Filter functions execute **before** class instantiation, so they cannot access instance properties or methods (`this` is not available). Use module-level variables, closures, or static data for filtering logic.

### Basic Filtering Example

```typescript
import { onBookmarkCreated, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  // Only handle bookmarks created in a specific folder
  @onBookmarkCreated({ 
    filter: (arg) => arg.bookmark.parentId === 'bookmarks_bar' 
  })
  handleBookmarkBarCreation(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) {
    console.log(`New bookmark added to bookmarks bar: ${arg.bookmark.title}`);
  }

  // Only handle bookmarks with URLs (not folders)
  @onBookmarkCreated({ 
    filter: (arg) => !!arg.bookmark.url 
  })
  handleNewBookmarkWithUrl(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) {
    console.log(`New bookmark with URL: ${arg.bookmark.url}`);
  }
}
```

### Advanced Filtering Examples

```typescript
import { onBookmarkChanged, onBookmarkRemoved, InjectableService } from 'deco-ext';

// Module-level configuration (accessible to filters)
const IMPORTANT_PARENT_FOLDERS = ['bookmarks_bar', 'other_bookmarks'];
const TEMP_FOLDER_PREFIX = '[Temp]';

@InjectableService()
class BookmarkService {
  // Filter bookmark changes by specific properties
  @onBookmarkChanged({ 
    filter: (arg) => arg.changeInfo.title !== undefined || arg.changeInfo.url !== undefined
  })
  handleImportantChanges(arg: { id: string, changeInfo: browser.Bookmarks.OnChangedChangeInfoType }) {
    console.log(`Important bookmark change detected for ID: ${arg.id}`);
  }

  // Filter bookmark removals to exclude temporary folders
  @onBookmarkRemoved({ 
    filter: async (arg) => {
      // You can use async logic in filters
      if (!arg.removeInfo.node) return true;
      
      // Skip if it's a temporary folder (using module-level constant)
      return !arg.removeInfo.node.title?.startsWith(TEMP_FOLDER_PREFIX);
    }
  })
  handlePermanentBookmarkRemoval(arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }) {
    console.log(`Permanent bookmark removed: ${arg.removeInfo.node?.title}`);
  }

  // Filter based on parent folder using module-level data
  @onBookmarkCreated({ 
    filter: (arg) => IMPORTANT_PARENT_FOLDERS.includes(arg.bookmark.parentId || '')
  })
  handleImportantFolderBookmarks(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) {
    console.log(`Bookmark created in important folder: ${arg.bookmark.title}`);
  }
}
```

### Filter with Parameter Decorators

Filters work seamlessly with parameter decorators:

```typescript
import { onBookmarkMoved, bookmarkMovedId, bookmarkMoveInfo, InjectableService } from 'deco-ext';

@InjectableService()
class BookmarkService {
  @onBookmarkMoved({ 
    filter: (arg) => arg.moveInfo.parentId !== arg.moveInfo.oldParentId // Only cross-folder moves
  })
  handleCrossFolderMove(
    @bookmarkMovedId() id: string,
    @bookmarkMoveInfo('parentId') newFolder: string,
    @bookmarkMoveInfo('oldParentId') oldFolder: string
  ) {
    console.log(`Bookmark ${id} moved from ${oldFolder} to ${newFolder}`);
  }
}
```

## Parameter Decorators

The Bookmarks API provides several parameter decorators for each event type:

### For onBookmarkCreated

- `bookmarkId()`: Gets the ID of the created bookmark
- `bookmarkNode([property])`: Gets specific properties from the bookmark node, such as 'title', 'url', etc.

### For onBookmarkChanged

- `bookmarkChangedId()`: Gets the ID of the changed bookmark
- `bookmarkChangeInfo([property])`: Gets specific change properties, such as 'title' or 'url'

### For onBookmarkMoved

- `bookmarkMovedId()`: Gets the ID of the moved bookmark
- `bookmarkMoveInfo([property])`: Gets specific move information properties, such as 'parentId', 'oldParentId', 'index', or 'oldIndex'

### For onBookmarkRemoved

- `bookmarkRemovedId()`: Gets the ID of the removed bookmark
- `bookmarkRemoveInfo([property])`: Gets specific remove information properties, such as 'parentId', 'index', or 'node'

## BookmarkTreeNode Object

The `BookmarkTreeNode` object represents a bookmark or folder in the bookmark tree:

```typescript
interface BookmarkTreeNode {
  id: string;              // A unique identifier for the node
  parentId?: string;       // The ID of the parent folder
  index?: number;          // The 0-based position within its parent folder
  url?: string;            // The URL for the bookmark (not present for folders)
  title: string;           // The title of the bookmark or folder
  dateAdded?: number;      // When the node was created (milliseconds since epoch)
  dateGroupModified?: number; // When the contents were last modified (folders only)
  children?: BookmarkTreeNode[]; // Child nodes (folders only)
  unmodifiable?: string;    // If present, node cannot be modified ("managed")
}
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a bookmark event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 
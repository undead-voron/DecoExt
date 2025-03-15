---
sidebar_position: 16
title: Downloads Decorators
---

# Downloads Decorators

The Downloads decorators allow you to easily respond to browser download events in your extension services. These decorators provide a clean way to track and manage file downloads.

## Method Decorators

### onDownloadCreated

This decorator handles events that fire when a download begins.

```typescript
import { onDownloadCreated, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadCreated()
  handleNewDownload(arg: { downloadItem: browser.Downloads.DownloadItem }) {
    console.log(`Download started: ${arg.downloadItem.filename}`);
    console.log(`URL: ${arg.downloadItem.url}`);
    console.log(`ID: ${arg.downloadItem.id}`);
    console.log(`File size: ${arg.downloadItem.totalBytes} bytes`);
  }
}
```

With parameter decorator:

```typescript
import { onDownloadCreated, downloadItem, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadCreated()
  handleNewDownload(
    @downloadItem('id') id: number,
    @downloadItem('filename') filename: string,
    @downloadItem('fileSize') fileSize: number
  ) {
    console.log(`Download #${id} started: ${filename} (${this.formatSize(fileSize)})`);
  }
  
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
}
```

### onDownloadChanged

This decorator handles events that fire when a download's state changes.

```typescript
import { onDownloadChanged, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadChanged()
  handleDownloadUpdate(arg: { downloadDelta: any }) {
    console.log(`Download updated: ID ${arg.downloadDelta.id}`);
    
    // Check what changed
    if (arg.downloadDelta.state) {
      console.log(`New state: ${arg.downloadDelta.state.current}`);
      
      if (arg.downloadDelta.state.current === 'complete') {
        console.log('Download completed!');
      } else if (arg.downloadDelta.state.current === 'interrupted') {
        console.log(`Download interrupted: ${arg.downloadDelta.error?.current}`);
      }
    }
    
    if (arg.downloadDelta.paused) {
      console.log(`Paused state changed to: ${arg.downloadDelta.paused.current}`);
    }
  }
}
```

With parameter decorator:

```typescript
import { onDownloadChanged, downloadDelta, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadChanged()
  handleStateChange(
    @downloadDelta('id') id: number,
    @downloadDelta('state') state: { current: string, previous: string }
  ) {
    if (state && state.current !== state.previous) {
      console.log(`Download #${id} changed from "${state.previous}" to "${state.current}"`);
      
      if (state.current === 'complete') {
        this.notifyDownloadComplete(id);
      }
    }
  }
  
  private notifyDownloadComplete(id: number) {
    // Notify the user that the download is complete
  }
}
```

### onDownloadErased

This decorator handles events that fire when a download is erased from browser history.

```typescript
import { onDownloadErased, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadErased()
  handleDownloadErased(arg: { downloadId: number }) {
    console.log(`Download erased: ID ${arg.downloadId}`);
    this.cleanupDownloadData(arg.downloadId);
  }
  
  private cleanupDownloadData(id: number) {
    // Remove any stored data related to this download
  }
}
```

With parameter decorator:

```typescript
import { onDownloadErased, downloadId, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadTracker {
  @onDownloadErased()
  handleDownloadErased(@downloadId() id: number) {
    console.log(`Download #${id} was erased from history`);
    this.removeFromDatabase(id);
  }
  
  private removeFromDatabase(id: number) {
    // Remove the download from your extension's database
  }
}
```

## Parameter Decorators

The Downloads API provides parameter decorators for each event type:

### downloadItem

Used with `onDownloadCreated` to extract specific properties from the download item:

```typescript
import { onDownloadCreated, downloadItem, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadAnalytics {
  @onDownloadCreated()
  trackDownload(
    @downloadItem('url') url: string,
    @downloadItem('filename') filename: string,
    @downloadItem('mime') mimeType: string,
    @downloadItem('startTime') startTime: string
  ) {
    const fileExt = filename.split('.').pop().toLowerCase();
    console.log(`New download: ${fileExt} file (${mimeType})`);
    console.log(`Started at: ${new Date(startTime).toLocaleString()}`);
  }
}
```

### downloadDelta

Used with `onDownloadChanged` to extract specific properties from the download delta:

```typescript
import { onDownloadChanged, downloadDelta, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadProgressTracker {
  @onDownloadChanged()
  trackProgress(
    @downloadDelta('id') id: number,
    @downloadDelta('bytesReceived') bytesReceived: { current: number, previous: number }
  ) {
    if (bytesReceived) {
      const downloadedBytes = bytesReceived.current - bytesReceived.previous;
      console.log(`Download #${id}: Received ${downloadedBytes} bytes`);
    }
  }
}
```

### downloadId

Used with `onDownloadErased` to get the download ID:

```typescript
import { onDownloadErased, downloadId, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadCleanup {
  @onDownloadErased()
  cleanupDownload(@downloadId() id: number) {
    console.log(`Cleaning up after erased download #${id}`);
  }
}
```

## Download States

Downloads can have the following states:

- `'in_progress'`: The download is in progress
- `'interrupted'`: The download has been interrupted
- `'complete'`: The download has completed successfully

## Working with Downloads Programmatically

In addition to tracking downloads, you can use the browser.downloads API to:

```typescript
// Start a new download
const downloadId = await browser.downloads.download({
  url: 'https://example.com/file.zip',
  filename: 'my-file.zip', // Optional: Suggest a filename
  saveAs: true // Optional: Show "Save As" dialog
});

// Pause a download
await browser.downloads.pause(downloadId);

// Resume a download
await browser.downloads.resume(downloadId);

// Cancel a download
await browser.downloads.cancel(downloadId);

// Get information about a download
const downloadItem = await browser.downloads.search({ id: downloadId });

// Open the downloads folder
await browser.downloads.showDefaultFolder();
```

## Implementation Details

These decorators use a singleton pattern to ensure only one event listener is registered per event type, and then route events to all decorated methods. When a download event occurs:

1. The event is received by the single registered browser API listener
2. The event data is passed to all registered method handlers
3. For each handler:
   - The class instance is resolved from the dependency injection container
   - If the class has an `init` method, it's called before handling the event
   - If parameter decorators are used, the event data is transformed accordingly
   - The method is called with the appropriate parameters

The decorators can only be used on methods within classes that have been decorated with the `InjectableService` decorator from deco-ext. 
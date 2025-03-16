---
sidebar_position: 14
title: Downloads Decorators
---

# Downloads Decorators

The Downloads decorators allow you to easily respond to download events in your extension service. These decorators provide a clean way to monitor and react to downloads being created, changed, or erased.

## Method Decorators

### onDownloadCreated

This decorator handles events that fire when a download begins.

```typescript
import { onDownloadCreated, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadMonitor {
  @onDownloadCreated()
  handleNewDownload(downloadItem: browser.Downloads.DownloadItem) {
    console.log(`New download started: ${downloadItem.filename}`);
    console.log(`Download ID: ${downloadItem.id}`);
    console.log(`URL: ${downloadItem.url}`);
    console.log(`File size: ${downloadItem.fileSize} bytes`);
  }
}
```

With parameter decorator:

```typescript
import { onDownloadCreated, downloadItem, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadMonitor {
  @onDownloadCreated()
  handleNewDownload(
    @downloadItem('id') id: number,
    @downloadItem('filename') filename: string,
    @downloadItem('url') url: string,
    @downloadItem('mime') mimeType: string
  ) {
    console.log(`Download #${id} started: ${filename}`);
    console.log(`From URL: ${url}`);
    console.log(`MIME type: ${mimeType}`);
  }
}
```

### onDownloadChanged

This decorator handles events that fire when a download is updated.

```typescript
import { onDownloadChanged, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadMonitor {
  @onDownloadChanged()
  handleDownloadChange(downloadDelta: browser.Downloads.OnChangedDownloadDeltaType) {
    console.log(`Download #${downloadDelta.id} was changed`);
    
    if (downloadDelta.state) {
      console.log(`State changed to: ${downloadDelta.state.current}`);
    }
    
    if (downloadDelta.paused) {
      console.log(`Paused state changed to: ${downloadDelta.paused.current}`);
    }
    
    if (downloadDelta.error) {
      console.log(`Error: ${downloadDelta.error.current}`);
    }
  }
}
```

With parameter decorator:

```typescript
import { onDownloadChanged, downloadDelta, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadMonitor {
  @onDownloadChanged()
  handleDownloadChange(
    @downloadDelta('id') id: number,
    @downloadDelta('state') state: { current: string; previous: string } | undefined,
    @downloadDelta('totalBytes') bytes: { current: number; previous: number } | undefined
  ) {
    console.log(`Download #${id} was changed`);
    
    if (state) {
      console.log(`State changed from ${state.previous} to ${state.current}`);
    }
    
    if (bytes) {
      console.log(`Total bytes changed from ${bytes.previous} to ${bytes.current}`);
    }
  }
}
```

### onDownloadErased

This decorator handles events that fire when a download is erased from history.

```typescript
import { onDownloadErased, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadMonitor {
  @onDownloadErased()
  handleDownloadErasure(downloadId: number) {
    console.log(`Download #${downloadId} was erased from history`);
    // Clean up any references to this download in your extension
    this.removeDownloadReference(downloadId);
  }
  
  private removeDownloadReference(id: number) {
    // Custom cleanup logic
  }
}
```

## Parameter Decorators

### downloadItem

Used with `onDownloadCreated` to extract specific properties from the download item:

```typescript
import { onDownloadCreated, downloadItem, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadLogger {
  @onDownloadCreated()
  logNewDownload(
    @downloadItem('id') id: number,
    @downloadItem('filename') filename: string,
    @downloadItem('url') url: string,
    @downloadItem('mime') mimeType: string,
    @downloadItem('startTime') startTime: string,
    @downloadItem('totalBytes') totalBytes: number
  ) {
    console.log(`Download #${id}: ${filename}`);
    console.log(`Started at: ${startTime}`);
    console.log(`Source: ${url}`);
    console.log(`MIME type: ${mimeType}`);
    console.log(`Size: ${totalBytes} bytes`);
  }
}
```

### downloadDelta

Used with `onDownloadChanged` to extract specific properties from the download delta object:

```typescript
import { onDownloadChanged, downloadDelta, InjectableService } from 'deco-ext';

@InjectableService()
class DownloadProgressTracker {
  @onDownloadChanged()
  trackProgress(
    @downloadDelta('id') id: number,
    @downloadDelta('state') state: { current: string; previous: string } | undefined,
    @downloadDelta('percentComplete') percent: { current: number; previous: number } | undefined
  ) {
    if (state && state.current === 'in_progress') {
      if (percent) {
        console.log(`Download #${id} progress: ${percent.current}%`);
      }
    } else if (state && state.current === 'complete') {
      console.log(`Download #${id} finished!`);
    }
  }
}
```

## Download Objects

### DownloadItem

The `DownloadItem` object provided to `onDownloadCreated` typically includes:

- `id`: The identifier for the download
- `url`: The URL of the downloaded file
- `filename`: The filename of the downloaded file
- `mime`: The MIME type of the downloaded file
- `startTime`: The time when the download began
- `endTime`: The time when the download ended (if it's complete)
- `state`: The download state (e.g., "in_progress", "interrupted", "complete")
- `fileSize`: The size of the file in bytes
- `exists`: Whether the downloaded file still exists
- `byExtensionId`: The ID of the extension that initiated the download (if applicable)
- `byExtensionName`: The name of the extension that initiated the download (if applicable)

### OnChangedDownloadDeltaType

The `OnChangedDownloadDeltaType` object provided to `onDownloadChanged` includes:

- `id`: The identifier for the download
- Various optional properties representing changes, each containing `current` and `previous` values:
  - `state`: The download state
  - `paused`: Whether the download is paused
  - `error`: Any error that occurred
  - `totalBytes`: Total bytes of the download
  - `fileSize`: Size of the file in bytes
  - `exists`: Whether the file exists
  - `filename`: The filename
  - `mime`: The MIME type
  - `estimatedEndTime`: The estimated completion time
  - `dangerType`: Any security risks associated with the file
  - `url`: The download URL
  - `finalUrl`: The final URL after redirects

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
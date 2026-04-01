# # <span style="color: #32ae62;">Introduction to Lemonade</span>

Lemonade provides an Electron-compatible API layer for web-based applications, allowing Electron apps to run in a browser environment with minimal modifications.

## Overview

Lemonade mimics Electron's API structure and provides browser-based implementations of common Electron modules. This allows developers to write code that works in both Electron and web environments.

## Supported Modules

### Core Modules

#### `app` - Application Lifecycle
- `app.getName()` / `app.setName()` - Get/set application name
- `app.getVersion()` - Get application version
- `app.getPath(name)` - Get special directories (home, appData, userData, temp, downloads, documents, desktop)
- `app.isReady()` / `app.whenReady()` - Check application ready state
- `app.quit()` / `app.exit()` - Exit application
- `app.relaunch()` - Reload the application
- `app.getLocale()` - Get user locale

#### `BrowserWindow` - Window Management
- Constructor with options (width, height, title, icon, resizable, etc.)
- `loadURL(url)` - Load a URL (with proxy support)
- `loadFile(path)` - Load a local file
- `show()` / `hide()` - Show/hide window
- `minimize()` / `maximize()` - Minimize/maximize window
- `close()` / `destroy()` - Close window
- `setTitle(title)` / `getTitle()` - Window title
- `setSize(width, height)` / `getSize()` - Window size
- `setPosition(x, y)` / `getPosition()` - Window position
- `center()` - Center window on screen
- `setFullScreen(flag)` / `isFullScreen()` - Fullscreen mode
- Event listeners: `on()`, `once()`, `removeListener()`
- Events: `close`, `closed`, `show`, `hide`, `focus`, `blur`, `maximize`, `minimize`

#### `dialog` - Native Dialogs
- `showOpenDialog(options)` - File/directory picker
- `showSaveDialog(options)` - Save file dialog
- `showMessageBox(options)` - Message box with buttons
- `showErrorBox(title, content)` - Error alert

#### `shell` - Desktop Integration
- `openExternal(url)` - Open URL in default browser
- `openPath(path)` - Open file/directory
- `showItemInFolder(path)` - Show file in folder
- `moveItemToTrash(path)` - Move to trash
- `beep()` - Play system beep sound

#### `clipboard` - Clipboard Access
- `readText()` / `writeText(text)` - Text operations
- `readHTML()` / `writeHTML(html)` - HTML operations
- `readImage()` / `writeImage(image)` - Image operations
- `clear()` - Clear clipboard
- Supports async clipboard API

#### `ipcRenderer` / `ipcMain` - Inter-Process Communication
- `send(channel, ...args)` - Send message
- `invoke(channel, ...args)` - Request/response pattern
- `on(channel, listener)` - Listen for messages
- `once(channel, listener)` - Listen once
- `removeListener(channel, listener)` - Remove listener

#### `net` - Network Requests
- `request(url, options)` - Make HTTP request
- `fetch(url, options)` - Fetch API wrapper
- `isOnline()` - Check online status
- Supports timeout and abort signals

#### `screen` - Display Information
- `getPrimaryDisplay()` - Get primary display info
- `getAllDisplays()` - Get all displays
- `getDisplayNearestPoint(point)` - Find display at point
- Display info includes: bounds, workArea, size, scaleFactor, rotation

#### `process` - Process Information & Node.js Execution
- `process.platform` - OS platform (always "linux" in WebContainer)
- `process.arch` - Architecture (x64)
- `process.versions` - Version information (Node.js 18.x)
- `process.env` - Environment variables
- `process.argv` - Command line arguments
- `process.cwd()` - Current working directory
- `process.uptime()` - Process uptime
- `process.memoryUsage()` - Memory statistics
- `process.isNodeAvailable` - Check if WebContainer Node.js is ready
- **`process.exec(command, args, options)`** - Execute Node.js command via WebContainer
- **`process.spawn(command, args, options)`** - Spawn Node.js process via WebContainer
- **`process.runScript(scriptPath, args)`** - Run a Node.js script file
- **`process.evalNode(code)`** - Evaluate JavaScript in Node.js context
- `process.kill(pid)` - Kill a process by PID

**Note:** This module integrates with Terbium's WebContainer (`tb.node`) to provide real Node.js execution instead of simulation.

#### `Notification` - System Notifications
- Constructor with options (title, subtitle, body, icon)
- Event handling with `on()` / `off()`
- `show()` / `close()` - Display notification

## Usage Examples

### Basic Window Creation

```typescript
import { BrowserWindow } from './sys/lemonade';

const win = new BrowserWindow({
  width: 800,
  height: 600,
  title: 'My App',
  resizable: true,
});

win.loadURL('https://example.com');

win.on('close', () => {
  console.log('Window closing');
});
```

### Dialog Usage

```typescript
import { dialog } from './sys/lemonade';

const result = await dialog.showOpenDialog({
  title: 'Select File',
  properties: ['openFile'],
});

console.log('Selected:', result);
```

### IPC Communication

```typescript
import { ipcRenderer } from './sys/lemonade';

// Send message
ipcRenderer.send('message-channel', 'Hello');

// Listen for response
ipcRenderer.on('response-channel', (event, data) => {
  console.log('Received:', data);
});

// Request/response pattern
const result = await ipcRenderer.invoke('get-data', params);
```

### Clipboard Operations

```typescript
import { clipboard } from './sys/lemonade';

// Write text
await clipboard.writeText('Hello World');

// Read text
const text = await clipboard.readText();

// Write HTML
await clipboard.writeHTML('<b>Bold text</b>');
```

### Application Paths

```typescript
import { app } from './sys/lemonade';

const homePath = app.getPath('home');
const appDataPath = app.getPath('appData');
const userDataPath = app.getPath('userData');
```

### Node.js Execution with WebContainer

```typescript
import { process } from './sys/lemonade';

// Check if Node.js is available
if (process.isNodeAvailable) {
  // Execute a Node.js command
  const exitCode = await process.exec('node', ['--version']);
  
  // Run a script file from Terbium's filesystem
  await process.runScript('/home/user/script.js', ['arg1', 'arg2']);
  
  // Evaluate Node.js code directly
  const output = await process.evalNode('console.log(process.version)');
  
  // Spawn a long-running process
  const proc = await process.spawn('node', ['server.js']);
  proc.output.pipeTo(new WritableStream({
    write(chunk) {
      console.log(chunk);
    }
  }));
  
  // Install npm packages
  await process.exec('npm', ['install', 'express']);
}
```

### Shell Integration

```typescript
import { shell } from './sys/lemonade';

// Open URL
await shell.openExternal('https://example.com');

// Show file
shell.showItemInFolder('/path/to/file.txt');

// Move to trash
await shell.moveItemToTrash('/path/to/file.txt');
```

## Architecture

Lemonade wraps the underlying `window.tb` API (TerbiumOS API) and provides Electron-compatible interfaces. When an Electron method is called, Lemonade translates it to the appropriate `window.tb` call.

### Key Adapters

- **Window Management**: Maps to `window.tb.window.*`
- **File System**: Maps to `window.tb.fs.*`
- **Dialogs**: Maps to `window.tb.dialog.*`
- **Notifications**: Maps to `window.tb.notification.*`
- **Network**: Maps to `window.tb.libcurl.fetch`
- **Proxy**: Handles URL proxying via `window.tb.proxy.encode`
- **Node.js**: Uses `window.tb.node.webContainer` for real Node.js execution via WebContainer

## Limitations

Since Lemonade runs in a web environment, some Electron features have limitations:
Terbium's virtual file system
2. **Native Menus**: Not fully implemented
3. **System Tray**: Not available in web
4. **Native Notifications**: Uses Terbium's notification system
5. **Process Control**: Some methods are simulated (can't exit browser)
6. **Multiple Windows**: Limited support via Terbium's window manager
7. **Synchronous APIs**: Some sync methods are async
8. **Node.js**: Requires WebContainer to be initialized (`tb.node.isReady === true`)
7. **Synchronous APIs**: Some sync methods are async

## Future Enhancements

Potential additions:
- Menu/MenuItem support
- Tray icons (where possible)
- PowerMonitor
- Protocol handling
- Content tracing
- Crash reporter
- Native image handling
- Web contents manipulation
- Session management
- Cookies API
- Download manager

## Compatibility

Lemonade aims to maintain API compatibility with Electron 18+. Not all features are available due to browser limitations, but the API surface matches Electron where possible.

## Development

To extend Lemonade:

1. Add new module in `src/sys/lemonade/modulename.ts`
2. Export from `src/sys/lemonade/index.ts`
3. Implement Electron-compatible API
4. Map to `window.tb` equivalents
5. Document usage and limitations

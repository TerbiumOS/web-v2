# <span style="color: #32ae62;">Advanced Features</span>

**Last Updated**: v2.4.0 - 07/16/2026

This guide covers advanced features in Terbium v2 that go beyond basic application development. These features are available but may not be documented elsewhere.

Table of Contents:
- [Dusk Runtime](#dusk-runtime)
- [Terbium Cloud Authentication](#terbium-cloud)
- [Virtual File System (VFS/WebDAV)](#virtual-file-system)
- [Media Island](#media-island)
- [Scramjet Proxy](#scramjet-proxy)

---

## <span style="color: #32ae62;">Dusk Runtime</span>

Terbium includes a full browser-based runtime powered by [Dusk](https://github.com/Night-N3twork/Dusk), providing Node.js, POSIX shell, Python, and SQLite support without a server.

### Starting the Runtime

```javascript
// Start the Dusk runtime
await tb.dusk.start();

// Check if ready
if (tb.dusk.isReady) {
    console.log("Dusk is running!");
}

// Stop the runtime
await tb.dusk.stop();
```

### Spawning Processes

```javascript
await tb.dusk.start();

// Run Node.js
const nodeProc = await tb.dusk.node.spawn(['-e', 'console.log("Hello from Node!")']);
const exitCode = await nodeProc.exit;

// Run a shell command
const shellProc = await tb.dusk.shell.spawn('echo hello world');

// Run Python
const pyProc = await tb.dusk.python.spawn('-c "print(\'hello\')"');

// Open SQLite database
const dbProc = await tb.dusk.sqlite.spawn('/home/user/data.db');

// Low-level spawn (any Dusk binary)
const proc = await tb.dusk.spawn('/bin/node', ['script.js'], {
    cwd: '/home/user',
    env: { HOME: '/home/user', PATH: '/bin' },
    pty: { cols: 80, rows: 24 }
});
```

### Server Tracking

```javascript
// Listen for HTTP servers started inside Dusk processes
window.addEventListener('dusk-server-ready', (e) => {
    console.log(`Server on port ${e.detail.port}: ${e.detail.url}`);
});

// Or access the map directly
const servers = tb.dusk.servers; // Map<number, string>
```

### Process Management

```javascript
// List running process IDs
const pids = tb.dusk.listProcesses();

// Kill a process
tb.dusk.killProcess(pid);

// Resize a PTY
tb.dusk.resizePty(pid, cols, rows);
```

### Terminal Commands

The following commands are available in the Terbium terminal:

| Command | Description |
|---------|-------------|
| `node` | Node.js REPL and script execution |
| `dsh` | Dusk shell (POSIX-compatible) |
| `python` | Python 3 REPL and scripts |
| `sqlite [db]` | SQLite CLI |

### Notes

- Dusk requires [Cross-Origin Isolation](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated) — ensure your server sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers
- Each SpiderMonkey engine instance uses ~100MB of RAM
- Files are shared with Terbium's filesystem (TFS/OPFS) — no mounting needed
- For outbound HTTP/HTTPS, Dusk uses the configured Wisp server

### Backward Compatibility

The old `tb.node` API still works but is deprecated and will be removed in v3.0:

```javascript
// Deprecated — use tb.dusk.start() instead
tb.node.start();

// Deprecated — use tb.dusk.spawn() instead
const proc = await tb.node.webContainer.spawn('node', ['-e', 'console.log("hi")']);
```

---

## <span style="color: #32ae62;">Terbium Cloud Authentication</span>

Terbium Cloud (formerly known as TACC - Terbium Accounts Cloud Compute) provides centralized authentication and data synchronization across Terbium instances.

### API Overview

```javascript
const tb = parent.window.tb;

// Sign in to Terbium Cloud
await tb.tauth.signIn();

// Sign out
await tb.tauth.signOut();

// Check if user has a Terbium Cloud account
const hasAccount = await tb.tauth.isTACC();

// Get user information
const userInfo = await tb.tauth.getInfo();
console.log(userInfo.name, userInfo.email);

// Update user information
await tb.tauth.updateInfo({ displayName: 'New Name' });
```

### Cloud Sync API

Synchronize data across devices using Terbium Cloud:

```javascript
// Upload data to cloud
await tb.tauth.sync.upload({
    key: 'app-settings',
    data: { theme: 'dark', language: 'en' }
});

// Retrieve data from cloud
const settings = await tb.tauth.sync.retrieve('app-settings');
console.log(settings.theme); // 'dark'
```

### Example: Cloud-Synced Settings

```javascript
const tb = parent.window.tb;

async function saveSettings(settings) {
    // Save locally
    await tb.fs.promises.writeFile(
        '/home/.config/myapp/settings.json',
        JSON.stringify(settings),
        'utf8'
    );
    
    // Sync to cloud if user is signed in
    if (await tb.tauth.isTACC()) {
        await tb.tauth.sync.upload({
            key: 'myapp-settings',
            data: settings
        });
    }
}

async function loadSettings() {
    // Try to load from cloud first
    if (await tb.tauth.isTACC()) {
        try {
            const cloudSettings = await tb.tauth.sync.retrieve('myapp-settings');
            if (cloudSettings) return cloudSettings;
        } catch (e) {
            console.log('Could not load from cloud, using local settings');
        }
    }
    
    // Fall back to local settings
    const localData = await tb.fs.promises.readFile(
        '/home/.config/myapp/settings.json',
        'utf8'
    );
    return JSON.parse(localData);
}
```

### Use Cases

- User authentication across Terbium instances
- Syncing app settings and preferences
- Cloud backup of user data
- Cross-device continuity

---

## <span style="color: #32ae62;">Virtual File System (VFS/WebDAV)</span>

Terbium's VFS allows mounting remote storage via WebDAV, enabling access to network drives and cloud storage services.

### API Overview

```javascript
const tb = parent.window.tb;

// Add a WebDAV server
await tb.vfs.addServer({
    name: 'My Cloud Storage',
    url: 'https://webdav.example.com',
    username: 'user',
    password: 'pass'
});

// Mount a specific server
await tb.vfs.mount('My Cloud Storage', '/mnt/cloud');

// Mount all configured servers
await tb.vfs.mountAll();

// Remove a server
await tb.vfs.removeServer('My Cloud Storage');

// Check what filesystem a path is on
const fsType = tb.vfs.whatFS('/mnt/cloud/file.txt');
console.log(fsType); // 'vfs' or 'tfs'
```

### Example: Accessing Remote Files

```javascript
const tb = parent.window.tb;

// Mount a WebDAV share
await tb.vfs.mount('Company Drive', '/mnt/company');

// Now you can use regular fs APIs on mounted paths
const files = await tb.fs.promises.readdir('/mnt/company');
console.log('Remote files:', files);

// Read a remote file
const content = await tb.fs.promises.readFile('/mnt/company/document.txt', 'utf8');

// Write to remote storage
await tb.fs.promises.writeFile('/mnt/company/report.txt', 'Report content', 'utf8');
```

### Supported Services

Any WebDAV-compatible service, including:
- Nextcloud
- ownCloud
- Box.com
- Yandex Disk
- Many NAS devices (Synology, QNAP, etc.)

### Use Cases

- Accessing company/school network drives
- Integrating with cloud storage
- Collaborative file editing
- Remote backup and sync

---

## <span style="color: #32ae62;">Media Island</span>

The Media Island provides system-wide media controls in the app island (top bar), allowing centralized music and video playback control.

### API Overview

```javascript
const tb = parent.window.tb;

// Register music player
tb.mediaplayer.music({
    title: 'Song Title',
    artist: 'Artist Name',
    album: 'Album Name',
    artwork: '/path/to/album-art.jpg',
    duration: 240, // seconds
    onPlay: () => {
        // Resume playback
    },
    onPause: () => {
        // Pause playback
    },
    onSeek: (time) => {
        // Seek to time in seconds
    },
    onNext: () => {
        // Play next track
    },
    onPrevious: () => {
        // Play previous track
    }
});

// Register video player
tb.mediaplayer.video({
    title: 'Video Title',
    thumbnail: '/path/to/thumbnail.jpg',
    duration: 3600,
    onPlay: () => { /* ... */ },
    onPause: () => { /* ... */ },
    onSeek: (time) => { /* ... */ }
});

// Hide media controls
tb.mediaplayer.hide();

// Programmatically pause/play
tb.mediaplayer.pauseplay();
```

### Example: Music Player Integration

```javascript
const tb = parent.window.tb;
let audio = new Audio('/music/song.mp3');

tb.mediaplayer.music({
    title: 'My Favorite Song',
    artist: 'Amazing Artist',
    album: 'Greatest Hits',
    artwork: '/music/artwork.jpg',
    duration: audio.duration,
    
    onPlay: () => {
        audio.play();
    },
    
    onPause: () => {
        audio.pause();
    },
    
    onSeek: (time) => {
        audio.currentTime = time;
    }
});

// Update progress periodically
audio.addEventListener('timeupdate', () => {
    // Media island will show progress automatically
});
```

### Use Cases

- Music player applications
- Video player controls
- Podcast players
- System-wide media key support

---

## <span style="color: #32ae62;">Scramjet Proxy</span>

Terbium v2 uses [Scramjet](https://github.com/MercuryWorkshop/scramjet) as its primary web proxy, replacing the deprecated Ultraviolet proxy.

### What is Scramjet?

Scramjet is a modern web proxy that enables access to external websites through Terbium's security and privacy layer. It's used by:
- Browser applications
- PWAs that need external network access
- Any app that sets `proxy: true` in wmArgs

### Technical Details

- **Location**: Service worker at `/scramjet.sw.js`
- **Handler**: `src/sys/scramjet-handler.ts`
- **Transport**: Wisp (WebSocket-based proxy protocol)
- **DNS**: Cloudflare malware-blocking (1.1.1.3, 1.0.0.3)

### Configuration

Scramjet is automatically configured and doesn't require manual setup. However, you can customize behavior through backend configuration (see [Backend Configuration](backend-configuration.md)).

### For App Developers

To use Scramjet in your PWA:

```json
{
    "name": "My Web App",
    "wmArgs": {
        "proxy": true,
        "src": "https://example.com",
        "title": { "text": "My App" }
    }
}
```

When `proxy: true` is set, all requests are automatically routed through Scramjet.

### Migration from Ultraviolet

If you have apps that previously used Ultraviolet:
- Change `proxy: true` in wmArgs (Scramjet is now default)
- No code changes needed in most cases
- Scramjet provides better compatibility and performance

---

## <span style="color: #32ae62;">Additional Resources</span>

For more information:
- [API Reference](apis/readme.md) - Complete API documentation
- [Creating Applications](creating-apps.md) - App development guide
- [Backend Configuration](backend-configuration.md) - Server setup

---

## <span style="color: #32ae62;">Need Help?</span>

These features are advanced and may have limited documentation. If you encounter issues:
- Check the [GitHub Issues](https://github.com/TerbiumOS/terbium/issues)
- Review source code in `/src/sys/` for implementation details
- Ask in GitHub Discussions (if available)

# <span style="color: #32ae62;">Creating new applications</span>

**Last Updated**: v2.4.0 - 07/02/2026

Table of Contents:

- [Introduction](#introduction)
- [Using TB Features](#using-tb-features)
    - [Island Controls](#island-controls)
    - [WM Controls](#wm-controls)
- [Generating Manifests](#generating-manifests)
- [Adding your application to the app launcher](#adding-your-application-to-the-app-launcher)
- [Creating and Submiting your Application to the app store repo](#creating-new-applications)
    - [Formatting PWAs](#formatting-pwas)
    - [Formatting TAPPs](#formatting-tapps)
    - [Formatting Anura Apps](#formatting-anura-apps)

This guide shows current, developer-friendly examples for building apps on Terbium v2, including the recommended `tb.contextmenu` usage and the latest package-repo format.

## <span style="color: #32ae62;">Introduction</span>

Terbium v2 supports three types of applications, each suited for different use cases:

### 1. PWAs (Progressive Web Apps)
Progressive Web Apps are web applications that run in Terbium's window system. They're perfect for:
- Web-based services (YouTube, Discord, etc.)
- Applications that need network access through Terbium's proxy
- Quick prototypes and simple tools
- Apps that don't need local file system access

**Pros:**
- Easy to create and deploy
- No packaging required
- Can use external URLs
- Automatic updates when the source changes

**Cons:**
- Limited file system access
- Depends on network connectivity for external sources
- Less control over window behavior

### 2. TAPPs (Terbium Application Packages)
TAPPs are packaged applications distributed as `.tapp.zip` files. They're ideal for:
- Native-feeling applications
- Apps requiring extensive file system access
- Offline-capable applications
- Complex multi-file applications

**Pros:**
- Full access to Terbium APIs
- Can include multiple files and assets
- Work offline after installation
- Better integration with the system

**Cons:**
- Require packaging and distribution
- Need to be installed by users
- Updates require redistributing the package

### 3. Anura Apps
Anura applications are legacy apps from Anura v2.1. Include them if:
- You're porting existing Anura apps
- You need backward compatibility
- You're targeting both platforms

**Choosing the Right Type:**
- **Use PWAs** for web services, simple tools, or when you want easy deployment
- **Use TAPPs** for full-featured applications that need system integration
- **Use Anura Apps** only for legacy compatibility

This guide focuses primarily on PWAs and TAPPs, as they're the recommended formats for new Terbium v2 applications.

## <span style="color: #32ae62;">Building Your First App - Quick Start</span>

Let's create a simple TAPP application from scratch. This example demonstrates the core concepts you'll need.

### Step 1: Create Your App Directory

Create a new folder for your app:
```
/apps/user/[username]/myapp.tapp/
```

### Step 2: Create the Configuration File

Create `.tbconfig` in your app directory with the following content:

```json
{
  "title": "My First App",
  "wmArgs": {
    "title": { "text": "My First App", "weight": 600 },
    "icon": "icon.svg",
    "src": "index.html",
    "size": { "width": 600, "height": 400 },
    "single": false,
    "resizable": true,
    "snapable": true,
    "controls": ["minimize", "maximize", "close"]
  }
}
```

### Step 3: Create Your HTML File

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Hello, Terbium!</h1>
        <p>This is my first Terbium application.</p>
        <button id="clickMe">Click Me!</button>
        <p id="counter">Clicks: 0</p>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

### Step 4: Add Styling

Create `style.css`:

```css
@font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.ttf') format('truetype');
    font-display: swap;
}

body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
}

.container {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
}

button {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

#counter {
    margin-top: 1rem;
    font-size: 1.25rem;
}
```

### Step 5: Add Functionality

Create `app.js`:

```javascript
// Get reference to parent window's Terbium API
const tb = parent.window.tb;

let clickCount = 0;
const button = document.getElementById('clickMe');
const counter = document.getElementById('counter');

button.addEventListener('click', () => {
    clickCount++;
    counter.textContent = `Clicks: ${clickCount}`;
    
    // Show a notification after 10 clicks
    if (clickCount === 10) {
        tb.notification.Toast({
            message: 'You clicked 10 times!',
            application: 'My First App',
            iconSrc: '/fs/apps/user/' + sessionStorage.getItem('currAcc') + '/myapp.tapp/icon.svg',
            time: 3000
        });
    }
});

// Add a simple island control
tb.window.island.addControl({
    text: 'File',
    appname: 'My First App',
    id: 'myapp_file',
    click: () => {
        const appIsland = window.parent.document.querySelector('.app_island');
        const options = [
            { 
                text: 'Reset Counter', 
                click: () => {
                    clickCount = 0;
                    counter.textContent = 'Clicks: 0';
                }
            },
            null, // Separator
            { 
                text: 'About', 
                click: () => {
                    tb.dialog.Alert({
                        title: 'About My First App',
                        message: 'This is a simple demo app for Terbium v2!'
                    });
                }
            }
        ];
        
        tb.contextmenu.create({
            x: 6,
            y: appIsland.clientHeight + 12,
            iframe: false,
            options: options
        });
    }
});
```

### Step 6: Create an Icon

Create a simple SVG icon file named `icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
    <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
</svg>
```

### Step 7: Test Your App

1. Open the Terbium File Manager
2. Navigate to `/apps/user/[username]/myapp.tapp/`
3. Open `index.html` with the Webview application to test locally
4. Or add your app to the launcher (see section below)

### Step 8: Package for Distribution (Optional)

To create a `.tapp.zip` file for distribution:

1. Compress your `myapp.tapp` folder to a ZIP file
2. Rename it to `myapp.tapp.zip`
3. Users can double-click to install it

Your app folder should now look like this:
```
myapp.tapp/
├── .tbconfig
├── index.html
├── style.css
├── app.js
└── icon.svg
```

## <span style="color: #32ae62;">Using TB Features</span>

Use `wmArgs` to describe window behaviour and initial state. Example shape:

```json
{
    "title": { "text": "My App", "weight": 600 },
    "icon": "/apps/myapp/icon.svg",
    "src": "/apps/myapp/index.html",
    "native": true,
    "size": { "width": 900, "height": 650 },
    "single": false,
    "resizable": true,
    "snapable": false
}
```

- title: string or object (use `weight` for font weight or `html` for rich title)
- icon: path or URL to an icon
- src: URL or local path for the app content
- native: whether app uses a custom/native UI
- size: width/height and optional minWidth/minHeight
- single: open only one window instance
- resizable / snapable / maximizable / minimizable / closable: standard window flags

### Common wmArgs Properties Explained

**title**: Window title configuration
- String: `"My App"` - Simple text title
- Object: `{ text: "My App", weight: 600, html: "<b>My App</b>" }` - Rich title with styling

**icon**: Application icon
- Local path: `"icon.svg"` (relative to app directory)
- Absolute path: `"/apps/myapp/icon.svg"`
- External URL: `"https://example.com/icon.png"`

**src**: Application content source
- Local HTML: `"index.html"`
- External URL: `"https://example.com/app"`
- For PWAs using proxy, set `proxy: true`

**size**: Window dimensions
```json
{
    "width": 800,
    "height": 600,
    "minWidth": 400,
    "minHeight": 300
}
```

**Window Behavior Flags:**
- `single: true` - Only allow one instance of the app window
- `resizable: true` - Allow window resizing
- `snapable: true` - Allow window snapping to screen edges
- `maximizable: true` - Show maximize button (default: true)
- `minimizable: true` - Show minimize button (default: true)
- `closable: true` - Show close button (default: true)

**native**: Set to `true` if your app has a custom/native UI that doesn't need Terbium's default window chrome

**controls**: Array of control buttons to show
```json
["minimize", "maximize", "close"]
```

### Accessing the Terbium API

All Terbium APIs are accessed through the `tb` object in the parent window:

```javascript
// Always use parent.window.tb to access the API
const tb = parent.window.tb;

// File system operations
await tb.fs.promises.readFile('/path/to/file', 'utf8');
await tb.fs.promises.writeFile('/path/to/file', 'content', 'utf8');
await tb.fs.promises.readdir('/path/to/directory');

// Dialogs
tb.dialog.Alert({ title: 'Info', message: 'Hello!' });
tb.dialog.Message({ 
    title: 'Input', 
    defaultValue: 'Default',
    onOk: (value) => console.log('User entered:', value)
});

// Notifications
tb.notification.Toast({
    message: 'Operation complete',
    application: 'My App',
    iconSrc: '/path/to/icon.svg',
    time: 3000
});

// Create new windows
tb.window.create({
    title: { text: 'New Window' },
    icon: '/icon.svg',
    src: '/page.html',
    size: { width: 500, height: 400 }
});

// Open files with default handlers
tb.file.handler.openFile('/path/to/file.txt', 'text');

// User information
const username = await tb.user.username();
```

For complete API documentation, see [/docs/apis/readme.md](/docs/apis/readme.md)

### <a id="island-controls" style="color: #32ae52;">Island Controls</a>

The App Island allows you to add custom items in the left corner where the App Title appears. Terbium v2 provides a built-in context menu API you should prefer to custom implementations. Use `tb.window.island.addControl()` for island controls and `tb.contextmenu.create()` to show a contextual menu.

Canonical pattern (first-party apps use this):

```js
const tb = parent.window.tb;
const tb_island = tb.window.island;
const appIsland = window.parent.document.querySelector('.app_island');

tb_island.addControl({
    text: 'File',
    appname: 'Files',
    id: 'files_file',
    click: () => {
        const options = [
            { text: 'New File', click: async () => { /* create file */ } },
            { text: 'New Folder', click: async () => { /* create folder */ } },
            { text: 'Upload from Computer', click: () => { /* open file picker */ } }
        ];

        tb.contextmenu.create({
            x: 6,
            y: appIsland.clientHeight + 12,
            iframe: false,
            options: options
        });
    }
});
```

Notes and tips:
- `options` is an array where each element can be `null` (rendered as a separator) or an object `{ text, click, disabled, icon, ... }` (most first-party code uses `text` + `click`).
- `iframe: true` shows the menu inside the app iframe, `false` renders it in the top-level UI.
- Keep click handlers small and async-friendly; use `tb.dialog` for prompts and `tb.fs.promises` for file operations.
- For programmatic menus (right-click on items), build the `options` array dynamically and call `tb.contextmenu.create()` with coordinates from the pointer event.

Example: right-click handler inside a list item

```js
element.addEventListener('contextmenu', e => {
    e.preventDefault();
    const options = [{ text: 'Open', click: () => openItem(item) }, { text: 'Delete', click: () => deleteItem(item) }];
    tb.contextmenu.create({ x: e.clientX, y: e.clientY, iframe: true, options });
});
```

### <span style="color: #32ae62;">WM Controls</span>

The WM controls for the title bar can be declared through `wmArgs`. Use `title` as an object when you need richer title styling or weights, e.g. `title: { text: 'My App', weight: 600, html: '<b>My App</b>' }`.

### <a id="generating-manifests" style="color: #32ae62;">Generating Manifests</a>

Use the TB Dev SDK or the CLI helper to generate TAPP manifests. The CLI helper is:

```sh
pkg genmanifest
```

This prompts for fields and writes a manifest compatible with the packaging tool.

## <a id="adding-your-application-to-the-app-launcher" style="color: #32ae62;">Adding your application to the App Launcher</a>

If you want the app available locally on your site add it to the launcher array at `/src/init/index.ts` or call the runtime API:

```js
tb.launcher.addApp({ title: 'Calculator', icon: '/apps/calculator.tapp/icon.svg', src: '/apps/calculator.tapp/index.html', size: { width: 338, height: 556 } });
```

If you're submitting to the official package repo, skip adding it locally and follow the repo manifest rules in the next section.

## <a id="creating-new-applications" style="color: #32ae62;">Creating and Submiting your Application to the app store repo</a>

Make sure you forked the repository: [https://github.com/TerbiumOS/tb-repo](https://github.com/TerbiumOS/tb-repo) so you can make changes.

This is the recommended format for entries in a Terbium Package Repo `manifest.json` (the official app-repo). The repo is a plain JSON manifest with metadata and an `apps` array. Use the `assets` folder for images and icons where possible.

Repo metadata (top-level):

- `name` (string) — display name of the repo
- `icon` (string) — icon for the repo (defaults to `tb.svg` if omitted)

App entry types supported:

- PWAs (web apps)
- TAPPs (packaged Terbium apps)
- Anura packages

### <a id="formatting-pwas" style="color: #32ae62;">Formatting PWAs</a>

Pull Requests for apps are always reviewed. Basic guidelines for PWA entries:

- App should provide an `assets/com.tb.{appname}` folder for images when possible
- Icon should be defined in `assets/com.tb.{appname}/icon.[ext]` or a stable external URL
- WM Arguments and metadata belong in the `wmArgs` field of the app entry; PWAs should include `proxy: true` when the app is proxied

Example PWA entry:

```json
{
    "name": "YouTube",
    "icon": "https://raw.githubusercontent.com/TerbiumOS/app-repo/main/assets/com.tb.youtube/icon.png",
    "description": "Share your videos with friends, family, and the world.",
    "developer": "Google",
    "pkg-name": "youtube",
    "images": ["https://.../images/1.png"],
    "wmArgs": {
        "proxy": true,
        "title": { "text": "YouTube", "weight": 600 },
        "icon": "https://.../icon.png",
        "src": "https://youtube.com",
        "size": { "width": 600, "height": 400 },
        "single": true,
        "resizable": true
    }
}
```

### <a id="formatting-tapps" style="color: #32ae62;">Formatting TAPP's</a>

- Packaged TAPPs must include a `pkg-download` field (URL to the downloadable TAPP zip). Do NOT include `wmArgs` for packaged TAPPs — the manifest inside the package defines runtime args.
- The app package should be named `{appname}.TAPP.zip` or `com.tb.{appname}.TAPP.zip` when stored in `assets`.

Example TAPP entry:

```json
{
    "name": "About Proxy",
    "icon": "https://aboutproxy.pages.dev/aboutbrowser/darkfavi.png",
    "description": "Chrome for your browser",
    "images": ["https://.../images/1.png"],
    "developer": "r58playz",
    "pkg-name": "aboutproxy",
    "pkg-download": "https://tbapps.pages.dev/assets/aboutproxy.TAPP.zip"
}
```

### <a id="formatting-anura-apps" style="color: #32ae62;">Formatting Anura Apps</a>

- Anura entries must include an `anura-pkg` field (URL to the app zip). Do not include `wmArgs` or `pkg-download` for Anura entries.

Example Anura entry:

```json
{
    "name": "Snae Player",
    "icon": "https://.../icon.png",
    "description": "A music client ported to Anura",
    "developer": "Mercury Workshop",
    "pkg-name": "snaeplayer",
    "anura-pkg": "https://.../app.zip"
}
```

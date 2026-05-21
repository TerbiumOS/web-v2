# <span style="color: #32ae62;">Creating new applications</span>

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

Decide whether your app will be a PWA (web app) or a TAPP (packaged Terbium app). PWAs use `wmArgs` and the built-in proxy support; TAPPs are distributed as packaged archives with a download URL.

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

API notes:

- Create a window at runtime: `parent.window.tb.window.create(wmArgs)`
- Open files via built-in handler: `parent.window.tb.file.handler.openFile(path, ext)`
- See runtime APIs for dialogs, notifications and fs in the API docs.

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

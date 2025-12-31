# <span style="color: #32ae62;">API Docs</span>

**Last Updated**: v2.2.0 - 12/30/2025

So you're looking to use Terbium APIs. Well, you're in the right place! Terbium has a decent amount of components which I will break down below. The pages will include a description of the functions and code examples.

## Table of Contents
  - [Battery](#battery)
  - [Launcher](#launcher)
  - [Theme](#theme)
  - [Desktop](#desktop)
  - [Window](#window)
  - [Context Menu](#contextmenu)
  - [User](#user)
  - [Proxy](#proxy)
  - [Notification](#notification)
  - [Dialog](#dialog)
  - [Node](#node)
  - [Platform](#platform)
  - [Process](#process)
  - [Screen](#screen)
  - [VFS](#vfs)
  - [System](#system)
  - [Terbium Cloud (tauth)](#terbium-cloud-tauth)
  - [Mediaplayer](#mediaplayer)
  - [File](#file)
  - [Additional Libraries](#additional-libraries)

### Battery
  - **showPercentage**
    - Description: Shows the battery percentage in the system tray.
    - Returns: `Promise<string>` - Returns "Success" if successful.
    - Example:
      ```javascript
      await tb.battery.showPercentage();
      console.log("Battery percentage is now visible");
      ```

  - **hidePercentage**
    - Description: Hides the battery percentage in the system tray.
    - Returns: `Promise<string>` - Returns "Success" if successful.
    - Example:
      ```javascript
      await tb.battery.hidePercentage();
      console.log("Battery percentage is now hidden");
      ```

  - **canUse**
    - Description: Checks if the Battery Manager API is available on the current browser.
    - Returns: `Promise<boolean>` - `true` if available, `false` otherwise.
    - Example:
      ```javascript
      const canUseBattery = await tb.battery.canUse();
      if (canUseBattery) {
        console.log("Battery API is supported");
      }
      ```

### Launcher
  - **addApp**
    - Description: Adds an app to the app launcher.
    - Parameters:
      - `props: { name: string, icon: string, src: string, etc }`
    - Returns: `Promise<fullfilled>`
    - Example:
      ```javascript
      const wasadded = await tb.launcher.addAdd({
        name: "Example App",
        icon: "/home/icon.png",
      });
      console.log(wasadded)
      ```

  - **removeApp**
    - Description: Removes an app from the app launcher.
    - Parameters:
      - `appname: string` - The app id of the app to be removed.
    - Returns: `Promise<boolean>`
    - Example:
      ```js
      const removed = await tb.launcher.removeApp("exampleapp");
      if (removed) {
        console.log("App removed successfully");
      } else {
        console.log("App not found");
      }
      ```

### Theme [⚠ Deprecated]
  > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> The Theme API is deprecated and remains as a stub for legacy applications
  - **get**
    - Description: Gets the current theme settings.
    - Returns: `Promise<object>` - Theme settings.
    - Example:
      ```javascript
      const themeSettings = await tb.theme.get();
      console.log("Current Theme Settings:", themeSettings);
      ```

  - **set**
    - Description: Sets the theme settings.
    - Parameters:
      - `data: { color: string, font: string }` - New theme settings.
    - Returns: `Promise<boolean>` - `true` if successful.
    - Example:
      ```javascript
      await tb.theme.set({ color: "#ffffff", font: "Roboto" });
      console.log("Theme set successfully");
      ```

### Desktop
  - **preferences**
    - **setTheme**
      - Description: Sets the theme color.
      - Parameters:
        - `color: string` - The new theme color.
      - Example:
        ```javascript
        await tb.desktop.preferences.setTheme("#ff0000");
        console.log("Theme color set successfully");
        ```

    - **theme**
      - Description: Retrieves the current theme color.
      - Returns: `Promise<string>` - The current theme color.
      - Example:
      ```javascript
      const currentTheme = await tb.desktop.preferences.theme();
      console.log("Current theme color:", currentTheme);
      ```

    - **setAccent**
      - Description: Sets the accent color.
      - Parameters:
        - `color: string` - The new accent color.
      - Example:
        ```javascript
        await tb.desktop.preferences.setAccent("#00ff00");
        console.log("Accent color set successfully");
        ```

    - **getAccent**
      - Description: Gets the accent color.
      - Example:
        ```javascript
        await tb.desktop.preferences.getAccent();
        ```

  - **wallpaper**
    - **set**
      - Description: Sets the wallpaper path.
      - Parameters:
        - `path: string` - The file path of the wallpaper image.
      - Example:
        ```javascript
        await tb.wallpaper.set("/path/to/wallpaper.jpg");
        console.log("Wallpaper set successfully");
        ```

    - **contain**
      - Description: Sets the wallpaper mode to "contain".
      - Example:
        ```javascript
        await tb.wallpaper.contain();
        console.log("Wallpaper mode set to contain");
        ```

    - **stretch**
      - Description: Sets the wallpaper mode to "stretch".
      - Example:
        ```javascript
        await tb.wallpaper.stretch();
        console.log("Wallpaper mode set to stretch");
        ```

    - **cover**
      - Description: Sets the wallpaper mode to "cover".
      - Example:
        ```javascript
        await tb.wallpaper.cover();
        console.log("Wallpaper mode set to cover");
        ```

    - **fillMode**
      - Description: Retrieves the current wallpaper mode.
      - Returns: `Promise<string>` - The current wallpaper mode.
      - Example:
        ```javascript
        const currentMode = await tb.wallpaper.fillMode();
        console.log("Current wallpaper mode:", currentMode);
        ```

  - **dock**
    - **pin**
      - Description: Pins a new application to the dock.
      - Parameters:
        - `app: any` - The application to pin.
      - Returns: `Promise<string>` - Returns 'Success' if the app was pinned successfully.
      - Example:
        ```javascript
        await tb.dock.pin({ title: "MyApp", path: "/path/to/myapp" });
        console.log("Application pinned successfully");
        ```

    - **unpin**
      - Description: Unpins an application from the dock.
      - Parameters:
       - `app: string` - The title of the application to unpin.
      - Returns: `Promise<string>` - Returns 'Success' if the app was unpinned successfully.
      - Example:
        ```javascript
        await tb.dock.unpin("MyApp");
        console.log("Application unpinned successfully");
        ```

### Window
  - **close**
    - Description: closes the active window.
    - Example:
      ```javascript
      tb.window.close()
      ```
  - **minimize**
    - Description: minimizes the active window.
    - Example:
      ```javascript
      tb.window.minimize()
      ```
  - **maximize**
    - Description: maximize the active window.
    - Example:
      ```javascript
      tb.window.maximize()
      ```
  - **reload**
    - Description: refreshes the iframe (if present) in the active window.
    - Example:
      ```javascript
      tb.window.reload()
      ```
  - **changeSrc**
    - Description: Changes the src of the iframe (if present) in the active window.
    - Example:
      ```js
      tb.window.changeSrc("/fs/apps/system/about.tapp/index.html")
      ```
  - **getId**
    - Description: Gets the ID of the currently active window.
    - Returns: `Promise<string>` - Window ID.
    - Example:
      ```javascript
      const windowId = tb.window.getId();
      console.log("Current Window ID:", windowId);
      ```
  - **content**
    - **get**
      - Description: Gets the current HTML Content from inside the window
      - Returns: `Promise<HTMLDivElement>` - The HTML Content inside the window.
      - Example:
      ```javascript
      await tb.window.content.get()
      ```
    - **set**
      - Description: Sets the current HTML Content from inside the window
      - Example:
      ```javascript
      tb.window.content.set(`<div>hi (put any HTML Content here)</div>`)
      ```
  - **titlebar**
    - **setColor**
      - Description: Sets the fore-color of all the window's titlebars
      - Example:
      ```javascript
      tb.window.titlebar.setColor('#fff')
      ```
    - **setText**
      - Description: Sets the current window's title
      - Example:
      ```javascript
      tb.window.titlebar.setText('TB Docs')
      ```
    - **setBackgroundColor**
      - Description: Sets the background-color of all the window's titlebars
      - Example:
      ```javascript
      tb.window.titlebar.setBackgroundColor('#000')
      ```
  - **island**
    - **addControl**
      - Description: Adds a control to the TB App Island
      - Example:
      ```javascript
      tb.window.island.addControl({
        text: "<titleofcontrol>",
        appname: "<appname>",
        id: "<giverandomname>",
        click: () => {
          // Execute code here for when clicked
        }
      })
      ```
    - **removeControl**
      - Description: Removes a control from the TB App Island
      - Example:
      ```javascript
      tb.window.island.removeControl({
        id: "<idfromthatyouusedforaddingit>",
      })
      ```

### ContextMenu
  - **create**
    - Description: Creates a Context Menu at your desired location
    - Parameters:
      - `props: { x: number, y: number, options: Array, titlebar?: boolean }` - Context menu properties.
    - Example:
      ```javascript
      tb.contextmenu.create({
        x: 0,
        y: 0,
        options: [
          { text: "Option 1", click: () => console.log("Option 1 clicked") },
          { text: "Option 2", click: () => console.log("Option 2 clicked") },
        ]
      });
      ```

  - **close**
    - Description: Closes the currently open context menu.
    - Example:
      ```javascript
      tb.contextmenu.close();
      ```

### User
  - **username**
    - Description: Fetches the username of the current user.
    - Returns: `Promise<string>` - User's username.
    - Example:
      ```javascript
      const username = await tb.user.username();
      console.log("username:", username);
      ```
  - **pfp**
    - Description: Fetches the profile picture of the current user.
    - Returns: `Promise<string>` - URL/Base64 Encoding of the profile picture.
    - Example:
      ```javascript
      const pfp = await tb.user.pfp();
      console.log("PFP:", pfp);
      ```

### Proxy
  - **get**
    - Description: Gets the current proxy settings.
    - Returns: `Promise<string>` - Proxy settings.
    - Example:
      ```javascript
      const proxySettings = await tb.proxy.get();
      console.log("Using:", proxySettings);
      ```

  - **set**
    - Description: Selects the proxy.
    - Parameters:
      - `proxy: string` - New proxy settings.
    - Returns: `Promise<boolean>` - `true` if successful.
    - Example:
      ```javascript
      await tb.proxy.set("Ultraviolet");
      console.log("Proxy set successfully");
      ```

  - **updateSWs**
    - Description: Updates the Transport and Wisp Server of the proxy.
    - Example:
      ```javascript
      await tb.proxy.updateSWs();
      console.log("Service Workers updated successfully");
      ```

  - **encode**
    - Description: Encodes a URL in the desired format (Only avalible in XOR Currently)
    - Parameters:
      - `url: string` - The url to encode
      - `encoder: string` - The encoder (Only avalible in XOR currently)
    - Returns: `Promise<string>`
    - Example: 
      ```javascript
      await tb.proxy.encode('https://google.com', 'XOR')
      ```
  
  - **decode**
    - Description: Decodes a URL in the desired format (Only avalible in XOR Currently)
    - Parameters:
      - `url: string` - The url to decode
      - `decoder: string` - The decoder (Only avalible in XOR currently)
    - Returns: `Promise<string>`
    - Example: 
      ```javascript
      await tb.proxy.decode('https://google.com', 'XOR')
      ```

### Notification
  - **Message [🧪Experimental]**
    - Description: The notification that has an input field.
    - Parameters:
      - `props: { message: string, application: string, iconSrc: string, onOk?: Function, txt?: string, time?: number }` - Notification properties.
    - Example:
      ```javascript
      tb.notification.Message({ 
        message: "test", 
        application: "System", 
        iconSrc: "/assets/img/logo.png", 
        txt: "fieldtext" 
      });
      ```

  - **Toast**
    - Description: A simple notification
    - Parameters:
      - `props: { message: string, application: string, iconSrc: string, time?: number }` - Notification properties.
    - Example:
      ```javascript
      tb.notification.Toast({ 
        message: "test", 
        application: "System", 
        iconSrc: "/assets/img/logo.png", 
        time: 10000 
      });
      ```

### Dialog
  - **Alert**
    - Description: The Alert dialog
    - Parameters:
      - `props: { title: string, message: string }` - Alert properties.
    - Example:
      ```javascript
      tb.dialog.Alert({ title: "Alert", message: "This is an alert message." });
      ```

  - **Message**
    - Description: Displays a message dialog with specified properties.
    - Parameters:
      - `props: { title: string, defaultValue?: string, onOk?: Function, onCancel?: Function }` - Message dialog properties.
    - Example:
      ```javascript
      await tb.dialog.Message({
        title: "Example Message",
        defaultValue: "Default value",
        onOk: (value) => console.log("OK clicked with value:", value),
        onCancel: () => console.log("Cancel clicked")
      });
      ```

  - **Select**
    - Description: Lets you select a value from a dropdown
    - Parameters:
      - `props: { title: string, message?: string, options: Array<{text: string, value: any}>, onOk?: Function, onCancel?: Function }` - Select dialog properties.
    - Example:
      ```javascript
      await tb.dialog.Select({
        title: "Enter the permission level you wish to set",
        options: [{
          text: "Admin",
          value: "admin"
        }, {
          text: "User",
          value: "user"
        }, {
          text: "Group",
          value: "group"
        }, {
          text: "Public",
          value: "public"
        }],
        onOk: async (perm) => {
          console.log(perm);
        }
      });
      ```

  - **Auth**
    - Description: TB Permissions Authentication Dialog
    - Parameters:
      - `props: { title: string, defaultUsername?: string, onOk?: Function, onCancel?: Function }` - Auth dialog properties.
      - `options?: { sudo: boolean }` - Additional options to indicate if this is for sudo authentication.
    - Example:
      ```javascript
      await tb.dialog.Auth({
        title: "Example Message",
        defaultUsername: "Default value",
        onOk: (user, pass) => console.log("User and unhashed pass", user, pass),
        onCancel: () => console.log("Cancel clicked")
      }, { sudo: false });
      ```
      
  - **Permissions**
    - Description: Yes or No Dialog
    - Parameters:
      - `props: { title: string, message: string, onOk?: Function, onCancel?: Function }` - Permission dialog properties.
    - Example:
      ```javascript
      await tb.dialog.Permissions({
        title: "Example Message",
        message: "Do you want to continue?",
        onOk: () => console.log("OK clicked"),
        onCancel: () => console.log("Cancel clicked")
      });
      ```

  - **FileBrowser**
    - Description: Simple FileBrowser Dialog
    - Parameters:
      - `props: { title: string, filter?: string, onOk?: Function, onCancel?: Function, local?: boolean }` - FileBrowser dialog properties.
    - Example:
      ```javascript
      await tb.dialog.FileBrowser({
        title: "Select a file",
        filter: ".txt",
        onOk: (value) => console.log("File selected:", value),
      });
      ```

  - **DirectoryBrowser**
    - Description: Simple Directory Browser Dialog
    - Parameters:
      - `props: { title: string, defualtDir?: string, onOk?: Function, onCancel?: Function, local?: boolean }` - DirectoryBrowser dialog properties.
    - Example:
      ```javascript
      await tb.dialog.DirectoryBrowser({
        title: "Select a directory",
        defualtDir: "/home/",
        onOk: (value) => console.log("Selected Dir:", value),
      });
      ```

  - **SaveFile**
    - Description: Simple File Saving Dialog
    - Parameters:
      - `props: { title: string, defualtDir?: string, filename?: string, onOk?: Function, onCancel?: Function, local?: boolean }` - SaveFile dialog properties.
    - Example:
      ```javascript
      await tb.dialog.SaveFile({
        title: "Example Title",
        defualtDir: "/home/",
        filename: "tbdocs.md",
        onOk: (value) => console.log("Saved file to:", value)
      });
      ```

  - **Cropper**
    - Description: Image Cropper
    - Parameters:
      - `props: { title: string, img: string, onOk?: Function }` - Cropper dialog properties. **Image should be formatted in Base64**
    - Returns: `Promise<string>` - Resolves image when the dialog is closed
    - Example:
      ```javascript
      await tb.dialog.Cropper({
        title: "Example Title",
        img: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        onOk: (img) => console.log("new image", img)
      });
      ```

  - **WebAuth**
    - Description: Simple Authentication Dialog (for use in Web Authentication)
    - Parameters:
      - `props: { title: string, message?: string, defaultUsername?: string, onOk?: Function, onCancel?: Function }` - Auth dialog properties.
    > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> Because by default the password is not hashed, please encrypt the password if you plan to store it using `tb.crypto`
    - Example:
      ```javascript
      await tb.dialog.WebAuth({
        title: "Example Message",
        defaultUsername: "Default value",
        onOk: (user, pass) => console.log("User and unhashed pass", user, pass),
        onCancel: () => console.log("Cancel clicked")
      });
      ```

### Node
  - **webContainer**
    - Description: The current webContainer instance for the Node Subsystem. Refer to [WebContainers API](https://webcontainers.io/api) for documentation.
    - Returns: `WebContainer` instance
  
  - **servers**
    - Description: A Map of ports running on the Node Subsystem
    - Returns: `Map<number, string>` - Map of port numbers to server URLs

  - **isReady**
    - Description: Returns whether or not the WebContainer is booted.
    - Returns: `boolean` - `true` if ready, `false` otherwise

  - **start**
    - Description: Boots the WebContainer
    - Example:
      ```javascript
      tb.node.start();
      console.log("WebContainer started");
      ```
 
  - **stop**
    - Description: Stops the WebContainer
    - Returns: `boolean` - `true` if stopped successfully
    - Example:
      ```javascript
      try {
        const stopped = tb.node.stop();
        console.log("WebContainer stopped");
      } catch (err) {
        console.error("No WebContainer is running");
      }
      ```

### Platform
  - **getPlatform**
    - Description: Gets the current platform the user is using
    - Returns: `Promise<string>` - Platform ("mobile" or "desktop")
    - Example:
      ```javascript
      const platform = await tb.platform.getPlatform();
      console.log(`You're on: ${platform}`);
      ```

### Process
  - **kill**
    - Description: Kill a process with a PID
    - Parameters:
      - `config: string | number` - The PID of the process to kill
    - Example:
      ```javascript
      tb.process.kill('69420');
      ```

  - **list**
    - Description: List all available processes
    - Returns: `Object` - Object containing all windows with their details (name, wid, icon, pid, src, size)
    - Example:
      ```javascript
      const processes = tb.process.list();
      console.log(processes);
      ```

  - **create**
    - Description: Creates a new Process (Can also be used to generate a generic window)
    - Example:
      ```javascript
      tb.process.create();
      ```

  - **parse**
    - **build [🧪Experimental]**
      - Description: Building Process of Custom TML Formatted Apps
      - Parameters:
        - `src: string` - Source string to build
      - Returns: `void`
      - Example:
        ```javascript
        tb.process.parse.build("<tml>...</tml>");
        ```

### Screen
  - **captureScreen**
    - Description: Creates a screenshot of your screen and saves it
    - Returns: `Promise<void>`
    > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> The screen capture API is used with the alt+shift keybind. Be aware of that to prevent any conflictions with your application if you use a similar keybind.
    - Example: 
      ```javascript
      await tb.screen.captureScreen();
      ```

### VFS
  - **servers**
    - Description: A Map of the current users webdav servers
    - Returns: `Object` - VFSOperations
    - Example:
    ```js
    for (const instance of tb.vfs.servers) {
      const davInfo = instance[1];
      // Use dav instance info here including a already established connection if one is availible
    }
    ```
  - **currentServer**
    - Description: The current WebDav server to use for operations
    - Returns: `Object` - VFSOperations
    - Example:
    ```js
    const client = tb.vfs.currentServer.connection.client;
    // use webdav methods here or use VFS Operations as a drop in for working between TFS and VFS
    ```

  - **create**
    - Description: (async) Returns a new instance of VFS, You will probably not use this function unless your directly modifying terbiums codebase
    - Returns: `Promise<VFS>`
    - Example:
    ```js
    const vfs = await vfs.create();
    ```

  - **mount**
    - Description: Mounts the inputed server from vfs.servers
    - Parameters:
      - `serverName: string` - the name of the server to mount
    - Example:
    ```js
    await tb.vfs.mount("servername");
    ```

  - **mountAll**
    - Description: Mounts all servers avalible in vfs.servers
    - Example:
    ```js
    await tb.vfs.mountAll()
    ```

  - **addServer**
    - Description: Adds a server to the users WebDav server list
    - Parameters:
      - `Server: ServerInfo[]` - The server information to put in
    - Example:
    ```js
    await tb.vfs.addServer({
      name: "any name you want for the drive name";
      url: "https://somedavendpoint.com/";
      username: "IloveTerbiumDev";
      password: "XSTARSwasHere";
    })
    ```

  - **removeServer**
    - Description: Removes a server from the users WebDav server list
    - Parameters:
      - `ServerName: string` - The name of the server to remove
    - Example:
    ```js
    await tb.vfs.removeServer("webdav1")
    ```

  - **setServer**
    - Description: Sets `currentServer` to the requested server
    - Parameters:
      - `ServerName: string` - The server name to set the server too **NOTE** Server MUST be mounted to perform this operation.
    - Example:
    ```js
    await tb.vfs.setServer("webdav1");
    // tb.vfs.currentServer is now the instance of VFSOperations that webdav1 uses
    ```

  - **whatFS**
    - Description: Returns Either TFS or VFSOperations as the suitable File System for you to use for said drive
    - Parameters:
      - `Path: string` - The path to check
    - Example:
    ```js
    const fs = await tb.vfs.whatFS("/mnt/dav");
    // FS is VFSOperations
    const fs = await tb.vfs.whatFS("/home/XSTARS/");
    // FS is TFS.fs
    ```

  - **VFSOperations**
    > **NOTE:** This is **NOT** an API. This is an instance representing File System actions, WebDav client information, etc., and is referenced by several APIs above.
    #### Properties

    - **client**: `WebDavClient`  
      The WebDav Client Interface.

    #### Methods

    - **readdir(path, callback)**
      - Reads the contents of a directory at the given path.
      - **Parameters:**
        - `path: string` — Directory path.
        - `callback: (err: any, files?: any[]) => void` — Called with error or array of file names.

    - **readFile(path, callback)**
      - Reads the contents of a file as text.
      - **Parameters:**
        - `path: string` — File path.
        - `callback: (err: any, data?: string) => void` — Called with error or file data.

    - **writeFile(path, data, callback)**
      - Writes data to a file, replacing its contents.
      - **Parameters:**
        - `path: string` — File path.
        - `data: string | ArrayBuffer` — Data to write.
        - `callback: (err: any) => void` — Called with error if any.

    - **delete(path, callback)**
      - Deletes a file at the specified path.
      - **Parameters:**
        - `path: string` — File path.
        - `callback: (err: any) => void` — Called with error if any.

    - **rename(oldPath, newPath, callback)**
      - Renames or moves a file from `oldPath` to `newPath`.
      - **Parameters:**
        - `oldPath: string` — Original file path.
        - `newPath: string` — New file path.
        - `callback: (err: any) => void` — Called with error if any.

    - **createDirectory(path, callback)**
      - Creates a new directory at the specified path.
      - **Parameters:**
        - `path: string` — Directory path.
        - `callback: (err: any) => void` — Called with error if any.

    - **exists(path, callback)**
      - Checks if a file or directory exists at the given path.
      - **Parameters:**
        - `path: string` — Path to check.
        - `callback: (err: any, exists?: boolean) => void` — Called with error or existence boolean.

    - **stat(path, callback)**
      - Retrieves metadata/statistics about a file or directory.
      - **Parameters:**
        - `path: string` — Path to check.
        - `callback: (err: any, stat?: any) => void` — Called with error or stat object.

    - **copy(source, destination, callback)**
      - Copies a file from source to destination.
      - **Parameters:**
        - `source: string` — Source file path.
        - `destination: string` — Destination file path.
        - `callback: (err: any) => void` — Called with error if any.

    - **unlink(path, callback)**
      - Deletes a file at the specified path (alias for `delete`).
      - **Parameters:**
        - `path: string` — File path.
        - `callback: (err: any) => void` — Called with error if any.

    - **move(source, destination, callback)**
      - Moves a file from source to destination (alias for `rename`).
      - **Parameters:**
        - `source: string` — Source file path.
        - `destination: string` — Destination file path.
        - `callback: (err: any) => void` — Called with error if any.

    - **appendFile(path, data, callback)**
      - Appends data to the end of a file.
      - **Parameters:**
        - `path: string` — File path.
        - `data: string | ArrayBuffer` — Data to append.
        - `callback: (err: any) => void` — Called with error if any.

    All of these functions also have a Promises variant that has the exact same syntax except it does not have a callback instead you use it asynchronously


### System
  - **version**
    - Description: Lists the version of Terbium
    - Returns: `string` - Terbium version.
    - Example:
      ```javascript
      const terbiumVersion = tb.system.version();
      console.log("Terbium v:", terbiumVersion);
      ```

  - **instance**
    - **repo**
      - Description: Lists the repository information
      - Returns: `string` - Repository information.
      - Example:
        ```javascript
        const repo = tb.system.instance.repo;
        console.log("The repo is: " + repo);
        ```

    - **hash**
      - Description: Lists the git commit hash
      - Returns: `string` - Git hash.
      - Example:
        ```javascript
        const hash = tb.system.instance.hash;
        console.log("The git hash is: " + hash);
        ```

  - **openApp**
    - Description: Opens an installed application
    - Parameters:
      - `pkg: string` - Package ID of the app.
    - Example:
      ```javascript
      await tb.system.openApp("browser");
      ```

  - **download**
    - Description: Download a file from the internet to the File System
    - Parameters:
      - `url: string` - URL of the file to download.
      - `location: string` - Destination path in the file system.
    - Returns: `Promise<void>`
    - Example: 
      ```javascript
      await tb.system.download('https://example.com/example.txt', '/home/exampledownload.txt');
      ```

  - **exportfs**
    - Description: Exports the file system as a zip file
    - Parameters:
      - `startPath?: string` - Starting path (default: "/")
      - `filename?: string` - Output filename (default: "tbfs.backup.zip")
    - Returns: `Promise<string>` - URL of the created zip file
    - Example:
      ```javascript
      await tb.system.exportfs("/home/", "backup.zip");
      ```

  - **users**
    - **list**
      - Description: Lists all users in the system
      - Returns: `Promise<string[]>` - Array of usernames
      - Example:
        ```javascript
        const users = await tb.system.users.list();
        console.log(users);
        ```

    - **add**
      - Description: Adds a user to the system
      - Parameters:
        - `user: { username: string, password: string, pfp: string, perm: string, securityQuestion?: { question: string, answer: string } }` - User information
      - Returns: `Promise<boolean>` - `true` if successful
      - Example:
        ```javascript
        await tb.system.users.add({ 
          username: 'XSTARS', 
          password: 'terbium1234', 
          pfp: 'data:image/png;base64,...', 
          perm: 'Admin' 
        });
        ```

    - **remove**
      - Description: Removes a user from the system
      - Parameters:
        - `id: string` - Username to remove
      - Returns: `Promise<boolean>` - `true` if successful
      - Example:
        ```javascript
        await tb.system.users.remove('XSTARS');
        ```

    - **update**
      - Description: Updates the data on a user
      - Parameters:
        - `user: { username: string, password?: string, pfp?: string, perm?: string, securityQuestion?: object }` - User information to update
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.system.users.update({ 
          username: 'XSTARS', 
          password: 'iloveterbium', 
          pfp: 'data:image/png;base64,...', 
          perm: 'Public' 
        });
        ```

    - **renameUser**
      - Description: Renames a user in the system
      - Parameters:
        - `olduser: string` - Current username
        - `newuser: string` - New username
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.system.users.renameUser('oldname', 'newname');
        ```

  - **bootmenu**
    - **addEntry**
      - Description: Adds a boot entry into the Terbium Boot Menu
      - Parameters:
        - `name: string` - The name to display in the boot menu
        - `file: string` - The file to boot from (file path)
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.system.bootmenu.addEntry('Legacy TB', '/legacy-tb/index.html');
        ```

    - **removeEntry**
      - Description: Removes a boot entry from the Terbium Boot Menu
      - Parameters:
        - `name: string` - The name of the entry to remove
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.system.bootmenu.removeEntry('Legacy TB');
        ```

### Terbium Cloud (tauth)
  - **client**
    - Description: The authentication client instance for Terbium Cloud services
    - Returns: `AuthClient` - Authentication client object

  - **signIn**
    - Description: Sign in to Terbium Cloud Account
    - Returns: `Promise<any>` - Sign-in response with user data
    - Example:
      ```javascript
      try {
        const result = await tb.tauth.signIn();
        console.log("Signed in:", result.data.user);
      } catch (err) {
        console.error("Sign-in cancelled or failed:", err);
      }
      ```

  - **signOut**
    - Description: Sign out from Terbium Cloud Account
    - Returns: `Promise<void>`
    - Example:
      ```javascript
      await tb.tauth.signOut();
      console.log("Signed out successfully");
      ```

  - **isTACC**
    - Description: Checks if the current user (or specified user) is a Terbium Cloud Account
    - Parameters:
      - `username?: string` - Username to check (defaults to current user)
    - Returns: `Promise<boolean>` - `true` if user has TACC, `false` otherwise
    - Example:
      ```javascript
      const hasTACC = await tb.tauth.isTACC();
      if (hasTACC) {
        console.log("User has a Terbium Cloud Account");
      }
      ```

  - **updateInfo**
    - Description: Updates Terbium Cloud Account information
    - Parameters:
      - `user: Partial<User>` - User information to update (can include username, pfp, email, password, etc.)
    - Returns: `Promise<void>`
    - Example:
      ```javascript
      await tb.tauth.updateInfo({ 
        username: "newusername", 
        pfp: "data:image/png;base64,..." 
      });
      ```

  - **getInfo**
    - Description: Gets Terbium Cloud Account information
    - Parameters:
      - `username?: string` - Username to get info for (defaults to current user)
    - Returns: `Promise<User | null>` - User account information or null if not found
    - Example:
      ```javascript
      const info = await tb.tauth.getInfo();
      if (info) {
        console.log("Account info:", info);
      }
      ```

  - **sync**
    - **retrieve**
      - Description: Retrieves synced data from Terbium Cloud (settings, WebDAV servers, etc.)
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.tauth.sync.retrieve();
        console.log("Settings synced from cloud");
        ```

    - **upload**
      - Description: Uploads local settings and data to Terbium Cloud
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.tauth.sync.upload();
        console.log("Settings uploaded to cloud");
        ```

    - **isSyncing**
      - Description: Indicates whether a sync operation is currently in progress
      - Returns: `boolean` - `true` if syncing, `false` otherwise
      - Example:
        ```javascript
        if (tb.tauth.sync.isSyncing) {
          console.log("Sync in progress...");
        }
        ```

### Mediaplayer
  > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> Make sure that the endtime for the music and video island is formatted in seconds and not milliseconds or minutes, that applies to the time parameter (start time) as well.
  
  - **music**
    - Description: Activates the Music optimized Media Island
    - Parameters:
      - `props: { artist: string, track_name: string, album?: string, time?: number, background: string, endtime: number }` - Music player properties.
    - Example:
      ```javascript
      tb.mediaplayer.music({
        track_name: "Starboy",
        artist: "The Weeknd",
        endtime: 231,
        background: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/02/17/ce/0217ce34-c2b9-3d3d-1dec-586db3948753/23UMGIM22526.rgb.jpg/1200x1200bf-60.jpg"
      });
      ```

  - **video**
    - Description: Activates the Video optimized Media Island
    - Parameters:
      - `props: { creator: string, video_name: string, time?: number, background: string, endtime: number }` - Video player properties.
    - Example:
      ```javascript
      tb.mediaplayer.video({
        video_name: "The school smp one year later...",
        creator: "Playingallday383",
        endtime: 1273,
        background: "https://i.ytimg.com/vi/kiKmSq4gxNU/hqdefault.jpg"
      });
      ```

  - **hide**
    - Description: Hides the media island.
    - Example:
      ```javascript
      tb.mediaplayer.hide();
      ```

  - **pauseplay**
    - Description: Pauses or plays the content connected to the media island
    - Example:
      ```javascript
      tb.mediaplayer.pauseplay();
      ```

  - **isExisting**
    - Description: Tells you if the media island is already present or not.
    - Returns: `Promise<boolean>` - `true` if media island exists, `false` otherwise
    - Example:
      ```javascript
      const exists = await tb.mediaplayer.isExisting();
      if (exists) {
        console.log('A media island is already there');
      }
      ```

### File
  - **handler**
    - **openFile**
      - Description: Opens a file with the associated app based on file type.
      - Parameters:
        - `path: string` - Path of the file.
        - `type: string` - Type of the file (e.g., "text", "image", "video", "audio", "pdf", "webpage").
      - Returns: `Promise<void>`
      - Example:
        ```javascript
        await tb.file.handler.openFile("/home/example.txt", "text");
        ```

    - **addHandler**
      - Description: Adds a handler for a specific file extension
      - Parameters:
        - `app: string` - App name to handle the file type
        - `ext: string` - File extension
      - Returns: `Promise<boolean>` - Returns `true` if succeeded
      - Example:
        ```javascript
        await tb.file.handler.addHandler("ruffle", "swf");
        ```

    - **removeHandler**
      - Description: Removes a handler for a specific file extension
      - Parameters:
        - `ext: string` - File extension
      - Returns: `Promise<boolean>` - Returns `true` if succeeded
      - Example:
        ```javascript
        await tb.file.handler.removeHandler("swf");
        ```

### Additional Libraries
  - **[libcurl](https://www.npmjs.com/package/libcurl.js)**
    - Description: The libcurl networking API, used in Anura.net, TB Apps and tb.system.download
  - **[fflate](https://www.npmjs.com/package/fflate)**
    - Description: ZIP compression/decompression tool for Anura File Manager and TB Files App
  - **fs**
    - Description: File system API (TFS) for reading/writing files
  - **crypto**
    - Description: Password encryption tool
    - Parameters:
      - `pass: string` - Password to encrypt
      - `file?: string` - (optional) File to save the password to
    - Returns: `Promise<string>` - Encrypted password or "Complete" if saved to file
  - **vfs**
    - Description: Virtual File System for WebDAV servers and remote storage
  - **buffer**
    - Description: Buffer utility (from Filer) for working with binary data
  - **registry**
    - Description: System registry for storing and retrieving system-wide configuration
  - **sh**
    - Description: Shell interface for file system operations
  - **liquor (Anura)**
    - Description: Anura subsystem stub, provides compatibility with Anura applications
  - **lemonade (Electron)**
    - Description: Electron API compatibility layer for desktop-like features

Have fun developing for Terbium!

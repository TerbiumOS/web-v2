# <span style="color: #32ae62;">API Docs</span>

So you're looking to use Terbium APIs. Well, you're in the right place! Terbium has a decent amount of components which I will break down below. The pages will include a description of the functions and code examples.

## Table of Contents
  - [Launcher](#launcher)
  - [Theme](#theme)
  - [Desktop](#desktop)
  - [Window](#window)
  - [Context Menu](#contextmenu)
  - [User](#user)
  - [Proxy](#proxy)
  - [Notification](#notification)
  - [Dialog](#dialog)
  - [Platform](#platform)
  - [Process](#process)
  - [Screen](#screen)
  - [VFS](#vfs)
  - [System](#system)
  - [Mediaisland](#mediaisland)
  - [File](#file)
  - [Additional Libraries](#aditional-libraries)

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
    - Description: Creats a Context Menu at your desired location
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
    - Description: The notification that has a input feild.
    - Parameters:
      - `message, application, iconSrc, onOk (async), txt`
    - Example:
    ```javascript
    tb.notification.Message({ message: "test", application: "System", iconSrc: "/assets/img/logo.png", txt: "fieldtext" })
    ```
  - **Toast**
    - Description: A simple notification
    - Parameters:
      - `message, application, iconSrc, time`
    - Example:
    ```javascript
    tb.notification.Toast({ message: "test", application: "System", iconSrc: "/assets/img/logo.png", time: "10000" })
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
      - `props: { title: string, defaultValue: string, onOk?: Function, onCancel?: Function }` - Message dialog properties.
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
        - `props: { title: string, options: Array[{}] }`
      - Example:
      ```js
      await tb.dialog.Select({
        title: "Enter the permission level you wish to set (Ex: Admin, User, Group, Public)",
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
          console.log(perm)
        }
      })
      ```

  - **Auth**
    - Description: TB Permissions Authentication Dialog
    - Parameters:
      - `props: { title: string, defaultUsername: string, onOk: Function, onCancel: Function }` - Auth dialog properties.
    - Example:
      ```javascript
      await tb.dialog.Auth({
        title: "Example Message",
        defaultUsername: "Default value",
        onOk: (user, pass) => console.log("User and unhashed pass", user, pass),
        onCancel: () => console.log("Cancel clicked")
      });
      ```
      
  - **Permissions**
    - Description: Yes or No Dialog
    - Parameters:
      - `props: { title: string, message: string, onOk: Function, onCancel: Function }` - Permission dialog properties.
    - Example:
      ```javascript
      await tb.dialog.Permissions({
        title: "Example Message",
        message: "Default value",
        onOk: (value) => console.log("OK clicked with value:", value),
        onCancel: () => console.log("Cancel clicked")
      });
      ```

  - **FileBrowser**
    - Description: Simple FileBrowser Dialog
    - Parameters:
      - `props: { title: string, filter: string, onOk: Function }` - FileBrowser dialog properties.
    - Example:
      ```javascript
      await tb.dialog.FileBrowser({
        title: "Example Message",
        filter: ".<fileext>",
        onOk: (value) => console.log("File selected:", value),
      });
      ```

  - **DirectoryBrowser**
    - Description: Simple FileBrowser Dialog
    - Parameters:
      - `props: { title: string, filter: string, onOk: Function }` - FileBrowser dialog properties.
    - Example:
      ```javascript
      await tb.dialog.DirectoryBrowser({
        title: "Example Message",
        defualtDir: "/home/",
        onOk: (value) => console.log("Selected Dir:", value),
      });
      ```

  - **SaveFile**
    - Description: Simple File Saving Dialog
    - Parameters:
      - `props: { title: string, defualtDir: string, filename: string, onOk: Function }` - SaveFile dialog properties.
    - Example:
    ```javascript
    await tb.dialog.SaveFile({
      title: "Example Title",
      defualtDir: "/home/",
      filename: "tbdocs.md",
      onOk: (value) => console.log("Saved file to:", value)
    })
    ```

  - **cropper**
    - Description: Image Cropper
    - Parameters:
      - `props: { title: string, img: string, onOk: Function }` - Cropper dialog properties. **Image should be formated in Base64**
    - Returns `Promise<string>` - Resolves image when the dialog is closed
    - Example:
    ```js
    await tb.dialog.Cropper({
      title: "Example Title",
      img: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      onOk: (img) => console.log("new image", img)
    })
    ```

  - **WebAuth**
    - Description: Simple Authentication Dialog (for use in Web Authentication)
    - Parameters:
      - `props: { title: string, defaultUsername: string, onOk: Function, onCancel: Function }` - Auth dialog properties.
    > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> Because by default the password is not hashed, please encrypt the password if you plan to store the password using `tb.crypto`
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
  - **WebContainer**
    - Description: The current webContainer instance for the Node Subsystem, Refer to [here](https://webcontainers.io/api) for Documentation.
  
  - **servers**
    - Description: The Map of ports running on the Node Subsystem

  - **isReady**
    - Description: Returns weither or not the WebContainer is booted or not.
    - Returns: boolean

  - **start**
    - Description: Boots the WebContainer
 
  - **stop**
    - Description: Stops the WebContainer

### Platform
  - **getPlatform**
    - Description: Gets the current platform the user is using
    - Returns: `Promise<string>` - Platform (mobile or desktop)
    - Example:
      ```javascript
      const platform = await tb.platform.getPlatform()
      console.log(`your on: ${platform}`)
      ```

### Process
  - **kill**
    - Description: Kill a process with a PID
    - Example:
    ```javascript
    tb.process.kill('69420')
    ```
  - **list**
    - Description: List all avalible processes
    - Returns: `Array[Windows]`
    - Example:
    ```javascript
    tb.process.list()
    ```
  - **create**
    - Description: Creates a new Process (Can also be used to generate a generic window)
    - Example:
    ```javascript
    tb.process.create()
    ```
  - **parse**
    - **build [🧪Experimental]**
      - Description: Building Process of Custom TML Formatted Apps
      - Returns: `Promise<string>`

### Screen
  - **capture**
    - Description: Creates a screenshot of your screen
    > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> The screen capture API is used with the alt shift keybind. Be aware of that to prevent any conflictions with your application if you use a similar keybind.
    - Example: 
    ```javascript
    tb.screen.capture()
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
      - Description: Lists the version of Terbium
      - Returns: `string` - Terbium version.
      - Example:
        ```javascript
        const repo = tb.system.instance.repo;
        console.log("The repo is: " + repo);
        ```

    - **hash**
      - Description: Lists the version of Terbium
      - Returns: `string` - Terbium version.
      - Example:
        ```javascript
        const hash = tb.system.instance.hash;
        console.log("The git hash is: " + hash)
        ```

  - **openApp**
    - Description: Opens a Installed Application
    - Parameters:
      - `pkg: string` - Package ID of the app.
      - `options: { rest?: string }` - Additional options for the app.
    - Example:
      ```javascript
      await tb.system.openApp("com.tb.app", { rest: "args" });
      ```
  - **download**
    - Description: Download a file from the internet to the File System
    - Example: 
    ```javascript
    tb.system.download('https://example.com/example.txt', '/home/exampledownload.txt')
    ```
  - **exportfs**
    - Description: Exports the file system as a zip
    - Example:
      ```javascript
      tb.system.exportfs();
      ```
  - **users**
    - **list**
    - Description: Lists all Users
    - Example:
      ```javascript
      tb.system.users.list();
      ```
    - **add**
    - Description: Adds a user to the system
    - Example:
      ```javascript
      tb.system.users.add({ 'XSTARS', 'terbium1234', 'data:base64...', 'Admin' })
      ```
    - **remove**
    - Description: Removes a user from the system
    - Example:
      ```javascript
      tb.system.users.remove('XSTARS')
      ```
    - **update**
    - Description: Updates the data on a user
    - Example:
      ```javascript
      tb.system.users.add({ 'XSTARS', 'iloveterbium', 'data:base64...', 'Public' })
      ```
  - **bootmenu**
    - **addEntry**
    - Description: Adds a boot entry into the Terbium Boot Menu
    - Parameters:
      - `name: string`: The name to display in the boot menu
      - `bootfile: string`: The File to boot from (FilePath)
    - Example:
      ```javascript
      tb.system.bootmenu.addEntry({ 'Legacy TB', '/legacy-tb/index.html' });
      ```
    - **addEntry**
      - Description: Removes a boot entry from the Terbium Boot Menu
      - Example:
        ```javascript
        tb.system.bootmenu.removeEntry({ 'Legacy TB' });
        ```

### Mediaisland
  > <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> Make sure that the endtime for the music and video island is formated in seconds and not milliseconds or minutes, that applies to the time parameter (start time) as well.
  - **music**
    - Description: Activates the Music optimized Media Island
    - Parameters:
      - `props: artist: string, track_name: string, album: string, time: number<seconds>, background: string<url>, endtime: number<seconds>`
    - Example:
        ```javascript
        tb.mediaplayer.music({
          track_name: "Starboy",
          artist: "The Weeknd",
          endtime: "231",
          background: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/02/17/ce/0217ce34-c2b9-3d3d-1dec-586db3948753/23UMGIM22526.rgb.jpg/1200x1200bf-60.jpg"
        })
        ```

  - **video**
    - Description: Activates the Video optimized Media Island
    - Parameters:
      - `props: creator: string, video_name: string, time: number<seconds>, background: string<url>, endtime: number<seconds>`
    - Example:
        ```javascript
        tb.mediaplayer.video({
          video_name: "The school smp one year later...",
          creator: "Playingallday383",
          endtime: "1273",
          background: "https://i.ytimg.com/vi/kiKmSq4gxNU/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLA7dIIlpVKFjx2yZTkZYqptEzKbSA"
        })
        ```

  - **hide**
    - Description: Hides the media island.

  - **pauseplay**
    - Description: Pauses or plays the content connected to the media island

  - **isExisting**
    - Description: Tells you if the media island is already present or not.
    - Returns: `boolean` - True or False
    - Example:
      ```javascript
      if (tb.mediaplayer.isExisting === true) {
        console.log('womp womp, A island is already there')
      }
      ```

### File
  - **handler**
    - **openFile**
      - Description: Opens a file with the associated app based on file type.
      - Parameters:
        - `path: string` - Path of the file.
        - `type: string` - Type of the file.
      - Example:
        ```javascript
        tb.file.handler.openFile("/home/example.txt", "text");
        ```
    - **addHandler**
      - Description: Adds a handler to a file
      - Returns: `Promise<Boolean>` Returns true if succeeded
      - Parameters:
        - `appname: string` - App Name
        - `extension: string` - File Extension
      - Example:
        ```javascript
        tb.file.handler.addHandler("ruffle", "swf")
        ```
    - **removeHandler**
      - Description: Adds a handler to a file
      - Returns: `Promise<Boolean>` Returns true if succeeded
      - Parameters:
        - `extension: string` - File Extension
      - Example:
        ```javascript
        tb.file.handler.removeHandler("swf")
        ```

### Aditional Libraries
  - **[libcurl](https://www.npmjs.com/package/libcurl.js)**
    - Description: The libcurl networking API, Used in Anura.net, TB Apps and tb.system.download
  - **[fflate](https://www.npmjs.com/package/fflate)**
    - Description: ZIP tool for Anura File Manager and TB Files App
  - **fs**
    - Description: Stub for Filer if its undefined in the application
  - **crypto**
    - Description: Password Encryption Tool
    - Parameters:
      - `pass` - Password to Encrypt
      - `file?` - (optional) File to save the password to
    - Returns: `Promise<string>`
    - Example:
      ```js
        const gitpass = await tb.crypto('iloveterbium1234', '/system/var/git/cache.LOCK')
      ```
  - **liquor**
    - Description: Stub for Anura if its undefined in the application

Have fun developing for Terbium!

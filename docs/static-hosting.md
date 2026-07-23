# <span style="color: #32ae62;">Static Hosting Terbium</span>

**Last Updated**: v2.4.0 - 07/16/2026

This guide covers deploying Terbium to static hosting platforms. For this tutorial, Cloudflare Pages will be used, however the instructions will be similar on other static hosts.

### <span style="color: #32ae62;">Step 1: Fork and Connect Repository</span>

Fork this repository and connect your GitHub account to the static host of your choice.

> **⚠️ NOTE**: On Cloudflare Pages, Terbium is automatically configured to use Node 20. If you're using a different host, check with them that you are using Node 20 or later, as Terbium **WILL NOT** build on older versions.

### <span style="color: #32ae62;">Step 2: Configure Build Settings</span>

Under the `build` section command, enter: 
```bash
npm i; npm run build-static
```

**LEAVE THE START COMMAND BLANK IF IT EXISTS**

Then under the output directory, enter: `dist`

Click **Deploy** to start the build process.

### <span style="color: #32ae62;">Step 3: Configure Wisp Server (Optional)</span>

Now that the site is deployed, you have probably noticed that the default Wisp server won't be running since you're on static hosting. 

**Option 1: Configure during OOBE**  
You can configure the Wisp server URL during the Out-of-Box Experience (OOBE) when you first load Terbium.

**Option 2: Hardcode before deployment**  
If you wish to set a default Wisp server before deployment:
1. Navigate to `src/init/index.ts`
2. Find the Wisp server configuration (around line 41)
3. Replace the default expression:  
   ```typescript
   `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`
   ```
   With your Wisp server URL as a string:
   ```typescript
   "wss://your-wisp-server.example.com/wisp/"
   ```
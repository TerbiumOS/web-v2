# <span style="color: #32ae62;">Static Hosting Terbium</span>

For this tutorial, Cloudflare pages will be used however the instructions will be similar on other static hosts.

### <span style="color: #32ae62;">Step 1.</span>

Fork this repository and connect your github account to the static host of your choise.

> <span style="font-family: url('https://fonts.googleapis.com/css2?family=Roboto&display=swap'); color: #ffd900;">⚠</span> <span style="color: #ffd900;">NOTE:</span> On Cloudflare pages, Terbium is automatically configured to use Node 20. If you're using a different host check with them that you are using Node 20 or later as Terbium **WILL NOT** build on older versions.

### <span style="color: #32ae62;">Step 2.</span>

Under the `build` section command put: `npm i; npm run build-static` **LEAVE THE START COMMAND BLANK IF IT EXISTS**

Then under the output directory put the folder: `dist` and click Deploy

### <span style="color: #32ae62;">Step 3. (Optional)</span>

Now that the sites deployed, you have probably noticed that the Default wisp server wont be running since your static hosting. If you wish to change this navigate to `sys/init/index.ts` scroll down to Line 41 and replace the line: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/` with the wisp server of your choice as a string. If you dont want to do this you dont have to as you can change it in the OOBE.
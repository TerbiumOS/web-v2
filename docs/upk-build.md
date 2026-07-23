# <span style="color: #32ae62;">UPK Building</span>

**Last Updated**: v2.4.0 - 07/16/2026

By default, if you fork the Terbium v2 repo on GitHub, included will be a workflow that will automatically upload the latest UPK release to either the latest GitHub release (if applicable) or to a new GitHub tag.

However, if you want to build it yourself on your local machine, you will need the following dependencies:

- **Node.js** 22 or later
- **Python** 3.12 or later

## <span style="color: #32ae62;">Build Instructions</span>

### Step 1: Download UPK Tools

Download [UPK Tools](https://cdn.terbiumon.top/upk-tools.zip) from the Terbium CDN.

> **⚠️ SECURITY WARNING**: Be sure to check the source you are downloading the UPK Tools from. If you're downloading it from a source that is **NOT** hosted under `terbiumon.top`, please verify its not malicious content. TerbiumOS Development is not responsible for any damage caused by fraudulent downloads from non-official repositories.

### Step 2: Extract and Run Build Script

Extract the zip file in your Terbium directory and run the appropriate build script:

- **Windows**: Run `upk-all.ps1`
- **Linux/macOS/Unix**: Run `upk-all.sh`

### Step 3: Install in Anura

The build script will automatically install all needed tools and dependencies for the UPK build and compile it to a zip file named `terbium-upk.app.zip`.

You can open this file in any Anura instance and install Terbium as a UPK application.

## <span style="color: #32ae62;">What is UPK?</span>

UPK (Universal Package) is a packaging format that allows Terbium to run inside Anura as an application, providing cross-compatibility between the two operating systems.

# <span style="color: #32ae62;">UPK Building</span>

By default, if you fork the Terbium v2 repo on github included will be a workflow that will automatically upload the latest UPK release to either the latest github release (if applicable) or to a new github tag

However if you want to build it yourself on your local machine you can you just need the following dependencies:

- NodeJS 22 or later
- Python 3.12 or later

First, download [UPK Tools](https://cdn.terbiumon.top/upk-tools.zip) from the terbium cdn:

**⚠️ NOTE** Be sure to check the source you are downloading the UPK Tools from. If your downloading it form a source that is **NOT** hosted under `terbiumon.top` please make sure its not malicious content. TerbiumOS Developement is not responsible for any damage caused by fradulent downloads in non-official repositories

Next, extract the zip file in your terbium instance and run either upk-all.ps1 if your on windows or upk-all.sh if your on any other unix system

This file will automatically install all the needed tools and nescessities for the UPK Build and compile it to a zip file named `terbium-upk.app.zip` which you can open in any anura instance and install Terbium on it

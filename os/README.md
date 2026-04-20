# Debian Kiosk Image

This directory contains a minimal Debian live-image recipe for a single-purpose kiosk.

It boots without a window manager, autologins a `kiosk` user on `tty1`, and launches X directly.

By default it opens Chromium in fullscreen kiosk mode and points it at this project. You can also switch to a custom CEF application by changing the kiosk mode and command in `/etc/terbium/kiosk.env`.

## Prerequisites

Build the image on a Debian or Ubuntu host with `live-build` installed.

```bash
sudo apt-get install live-build chromium xinit xorg
```

## Build

From the repository root:

```bash
cd os
make
```

The default build targets Debian `bookworm` on `amd64` and produces a hybrid ISO.

To customize the kiosk URL or use a CEF launcher:

```bash
cd os
make KIOSK_URL=http://10.0.0.5:3000
make KIOSK_MODE=cef KIOSK_COMMAND='/opt/my-cef-app/my-app --app-url=http://127.0.0.1:3000'
```

## Runtime behavior

- No desktop environment or window manager is installed.
- The session starts with `startx` directly from the autologin shell.
- Screen blanking and DPMS are disabled.
- Chromium runs with `--kiosk` and full-screen flags.

## Custom CEF app

If you are packaging a CEF app, install the binary into the image and set `KIOSK_COMMAND` to the executable plus its arguments. The launcher runs that command inside the X session.

Example `kiosk.env` contents:

```bash
KIOSK_MODE=cef
KIOSK_URL=http://127.0.0.1:3000
KIOSK_COMMAND=/opt/cef-app/cef-app --app-url=http://127.0.0.1:3000
```
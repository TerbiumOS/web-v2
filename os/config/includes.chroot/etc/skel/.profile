#!/bin/sh

if [ "$(tty)" = "/dev/tty1" ] && [ -z "${DISPLAY:-}" ] && [ -z "${KIOSK_SESSION_STARTED:-}" ]; then
	. /etc/terbium/kiosk.env
	export KIOSK_SESSION_STARTED=1
	exec startx /bin/sh /usr/local/bin/kiosk-session -- :0 vt1 -keeptty -nolisten tcp
fi
SHELL := /bin/sh

LB ?= lb
DIST ?= bookworm
ARCH ?= amd64

.PHONY: all config build clean purge

all: build

config:
	$(LB) config --distribution $(DIST) --architectures $(ARCH) --binary-images iso-hybrid --debian-installer false --archive-areas "main contrib non-free-firmware" --bootappend-live "username=kiosk hostname=terbium-kiosk"

build: config
	$(LB) build

clean:
	$(LB) clean

purge:
	$(LB) clean --purge

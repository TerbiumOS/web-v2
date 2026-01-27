import { Notification } from "./notification";
import { BrowserWindow } from "./window";
import { Dialog } from "./dialog";
import { Net } from "./net";
import { app, App } from "./app";
import { shell, Shell } from "./shell";
import { clipboard, Clipboard } from "./clipboard";
import { ipcRenderer, ipcMain, IpcRenderer, IpcMain } from "./ipc";
import { screen, Screen } from "./screen";

export class Lemonade {
	get version(): string {
		return "1.1.0";
	}
	Notification = Notification;
	BrowserWindow = BrowserWindow;
	App = App;
	Net = Net;
	Dialog = Dialog;
	Shell = Shell;
	Clipboard = Clipboard;
	IpcRenderer = IpcRenderer;
	IpcMain = IpcMain;
	Screen = Screen;

	dialog = new Dialog();
	net = new Net();
	app = app;
	shell = shell;
	clipboard = clipboard;
	ipcRenderer = ipcRenderer;
	ipcMain = ipcMain;
	screen = screen;
}

export { Notification, BrowserWindow, Dialog, Net, app, shell, clipboard, ipcRenderer, ipcMain, screen };

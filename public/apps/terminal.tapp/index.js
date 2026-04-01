import parser from "https://unpkg.com/yargs-parser@22.0.0/browser.js";
import http from "https://cdn.jsdelivr.net/npm/isomorphic-git@latest/http/web/index.js";
import git from "https://cdn.jsdelivr.net/npm/isomorphic-git@latest/+esm";
import { Terminal } from "https://cdn.jsdelivr.net/npm/@xterm/xterm@latest/+esm";

/**
 * @typedef {import("yargs-parser").Arguments} argv
 */
/**
 * @typedef {function(string, argv)} commandHandler
 */
/**
 * @typedef {Object} appInfo
 * @property {string} name The name of the app
 * @property {string} description The description of the app
 * @property {string} usage How to use the app from the CLI
 */

// This is just to resove the terbium system api's
const tb = window.tb || window.parent.tb || {};

window.http = http;
window.gitfetch = git;

/**
 * Converts a hex color to an RGB string
 * @param {string} hex The hex color to convert
 * @returns {{r: number, g: number, b: number} | null} The RGB object for use in accent, or null if invalid
 */
function htorgb(hex) {
	hex = hex.replace("#", "");
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map(h => h + h)
			.join("");
	}
	if (hex.length !== 6) return null;
	const bigint = parseInt(hex, 16);
	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255,
	};
}

/**
 * Command that has been captured from the start of the other command prompt ending and after the newline carriage
 */
let accCommand = "";

/**
 * Cursor position within the current command (for left/right arrow navigation)
 */
let cursorPos = 0;

tb.setCommandProcessing = status => {
	sessions.forEach(s => {
		try {
			s.isProcessingCommands = status;
			s.localEcho = status;
		} catch (e) {}
	});
};
/**
 * Last few commands that have been executed
 */
let commandHistory = [];
let historyIndex = -1;
let path = `/home/${sessionStorage.getItem("currAcc")}/`;
const HISTORY_LIMIT = 1000;
const HISTORY_FILE = ".bash_history";

class TerminalSession {
	constructor(name = "Terbium TSH") {
		this.id = `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		this.name = name;
		this.container = document.createElement("div");
		this.container.className = "term-session";
		this.container.style.width = "100%";
		this.container.style.height = "100%";
		this.container.style.display = "none";
		document.getElementById("term").appendChild(this.container);

		this.term = new Terminal({ theme: { background: "#000000", cursor: "#ffffff", selection: "#444444" }, cursorBlink: true, allowTransparency: true, rightClickSelectsWord: true });
		this.term.open(this.container);

		this.accCommand = "";
		this.cursorPos = 0;
		this.isProcessingCommands = true;
		this.localEcho = true;
		this.commandHistory = [];
		this.historyIndex = 0;
		this.path = `/home/${sessionStorage.getItem("currAcc")}/`;

		this._bindEvents();
		this.loadHistory();
		this.writePowerline();
		this.focus();
	}

	_bindEvents() {
		this.term.element.addEventListener("contextmenu", e => e.preventDefault());
		this.term.attachCustomKeyEventHandler(event => {
			if (event.ctrlKey && event.key === "c") {
				if (this.term.hasSelection()) {
					navigator.clipboard.writeText(this.term.getSelection()).catch(console.error);
					event.preventDefault();
					return false;
				}
			}
			if (event.ctrlKey && event.key === "v") {
				navigator.clipboard
					.readText()
					.then(text => {
						for (const c of text) this.handleChar(c);
					})
					.catch(console.error);
				event.preventDefault();
				return false;
			}
			if (event.altKey && event.key === "t") {
				event.preventDefault();
				createSession("Terbium TSH");
				return false;
			}
			if (event.altKey && event.key === "w") {
				event.preventDefault();
				closeSession(this.id);
				return false;
			}
			if (event.altKey && event.key === "Tab") {
				event.preventDefault();
				switchSessionNext();
				return false;
			}
			return true;
		});

		this.term.onData(async char => {
			if (!this.isProcessingCommands) {
				const dataHandler = this.term._core._inputHandler;
				if (dataHandler && dataHandler.onData) dataHandler.onData(char);
				return;
			}
			if (char.length > 1 && !char.startsWith("\x1b")) {
				for (const c of char) await this.handleChar(c);
				return;
			}
			await this.handleChar(char);
		});

		this.term.onLineFeed(() => {
			this.accCommand = "";
			this.cursorPos = 0;
			this.historyIndex = this.commandHistory.length;
		});
	}

	async handleChar(char) {
		if (char === "\x1b[A") {
			if (this.historyIndex > 0 && this.commandHistory.length > 0) {
				this.term.write("\r\x1b[K");
				await this.writePowerline();
				this.historyIndex--;
				this.accCommand = this.commandHistory[this.historyIndex];
				this.cursorPos = this.accCommand.length;
				this.term.write(this.accCommand);
			}
			return;
		}
		if (char === "\x1b[B") {
			this.term.write("\r\x1b[K");
			await this.writePowerline();
			if (this.historyIndex < this.commandHistory.length - 1) {
				this.historyIndex++;
				this.accCommand = this.commandHistory[this.historyIndex];
				this.cursorPos = this.accCommand.length;
				this.term.write(this.accCommand);
			} else {
				this.historyIndex = this.commandHistory.length;
				this.accCommand = "";
				this.cursorPos = 0;
			}
			return;
		}
		if (char === "\x1b[D") {
			if (this.cursorPos > 0) {
				this.cursorPos--;
				this.term.write("\x1b[D");
			}
			return;
		}
		if (char === "\x1b[C") {
			if (this.cursorPos < this.accCommand.length) {
				this.cursorPos++;
				this.term.write("\x1b[C");
			}
			return;
		}
		if (char === "\x1b[H" || char === "\x1b[1~") {
			const moveLeft = this.cursorPos;
			if (moveLeft > 0) {
				this.term.write(`\x1b[${moveLeft}D`);
				this.cursorPos = 0;
			}
			return;
		}
		if (char === "\x1b[F" || char === "\x1b[4~") {
			const moveRight = this.accCommand.length - this.cursorPos;
			if (moveRight > 0) {
				this.term.write(`\x1b[${moveRight}C`);
				this.cursorPos = this.accCommand.length;
			}
			return;
		}
		if (char === "\x1b[3~") {
			if (this.cursorPos < this.accCommand.length) {
				this.accCommand = this.accCommand.slice(0, this.cursorPos) + this.accCommand.slice(this.cursorPos + 1);
				const remaining = this.accCommand.slice(this.cursorPos);
				this.term.write(remaining + " ");
				this.term.write(`\x1b[${remaining.length + 1}D`);
			}
			return;
		}
		if (char === "\x7f") {
			if (this.cursorPos > 0) {
				this.accCommand = this.accCommand.slice(0, this.cursorPos - 1) + this.accCommand.slice(this.cursorPos);
				this.cursorPos--;
				this.term.write("\b");
				const remaining = this.accCommand.slice(this.cursorPos);
				this.term.write(remaining + " ");
				this.term.write(`\x1b[${remaining.length + 1}D`);
			}
			return;
		}
		if (char === "\r") {
			this.term.writeln("");
			const input = this.accCommand.trim();
			if (input.length > 0) {
				await this.saveToHistory(input);
				const [cmd, ...rawArgs] = input.split(" ");
				const argv = parser(rawArgs);
				argv._raw = rawArgs.join(" ");
				await this.handleCommand(cmd, argv);
			} else {
				await this.writePowerline();
			}
			this.accCommand = "";
			this.cursorPos = 0;
			return;
		}
		if (char >= " " && char <= "~") {
			// Only echo locally when localEcho is enabled. In passthrough mode the program will echo input itself.
			this.accCommand = this.accCommand.slice(0, this.cursorPos) + char + this.accCommand.slice(this.cursorPos);
			this.cursorPos++;
			if (this.localEcho) {
				if (this.cursorPos === this.accCommand.length) {
					this.term.write(char);
				} else {
					const remaining = this.accCommand.slice(this.cursorPos - 1);
					this.term.write(remaining);
					this.term.write(`\x1b[${remaining.length - 1}D`);
				}
			}
		}
	}

	async writePowerline() {
		const username = await tb.user.username();
		const userSettings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${username}/settings.json`, "utf8"));
		const accent = await htorgb(userSettings.accent);
		const hostname = JSON.parse(await window.parent.tb.fs.promises.readFile("//system/etc/terbium/settings.json"))["host-name"];
		this.term.write(`\x1b[38;2;${accent.r};${accent.g};${accent.b}m${username}@${hostname}\x1b[39m ~ ${this.path}\x1b[0m: `);
	}

	async createNewCommandInput() {
		this.term.write("\r\n");
		await this.writePowerline();
		this.historyIndex = this.commandHistory.length;
	}
	async displayOutput(message, ...styles) {
		// If output indicates a shell/program exit, restore local echo / command processing
		try {
			const txt = String(message || "");
			if (/exited with code|shell exited|exit code/gi.test(txt)) {
				this.exitPassthrough();
			}
		} catch (e) {}

		if (message.includes("%c")) {
			const parts = message.split(/(%c)/);
			let styled = "";
			let styleIndex = 0;
			for (let i = 0; i < parts.length; i++) {
				if (parts[i] === "%c") {
					const text = parts[++i] || "";
					const style = styles[styleIndex++] || "";
					const colorMatch = style.match(/color:\s*(#[0-9a-fA-F]{3,6})/);
					if (colorMatch) {
						const rgb = await htorgb(colorMatch[1]);
						if (rgb) {
							styled += `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m${text}\x1b[0m`;
						} else {
							styled += text;
						}
					} else {
						styled += text;
					}
				} else {
					styled += parts[i];
				}
			}
			this.term.writeln(styled);
		} else {
			this.term.writeln(message);
		}
	}
	async displayError(message) {
		this.term.writeln(`\x1b[31mERR: ${message}\x1b[0m`);
	}
	async loadHistory() {
		try {
			const username = await tb.user.username();
			const historyPath = `/home/${username}/${HISTORY_FILE}`;
			const data = await window.parent.tb.fs.promises.readFile(historyPath, "utf8");
			this.commandHistory = data.split("\n").filter(cmd => cmd.trim() !== "");
		} catch {}
		this.historyIndex = this.commandHistory.length;
	}
	async saveToHistory(command) {
		if (!command.trim()) return;
		this.commandHistory.push(command);
		if (this.commandHistory.length > HISTORY_LIMIT) this.commandHistory.shift();
		this.historyIndex = this.commandHistory.length;
		try {
			const username = await tb.user.username();
			const historyPath = `/home/${username}/${HISTORY_FILE}`;
			await window.parent.tb.fs.promises.writeFile(historyPath, this.commandHistory.join("\n"));
		} catch (error) {
			console.error("Failed to save history", error);
		}
	}
	async handleCommand(name, args) {
		const appInfo = await getAppInfo();
		if (name === "exit") {
			closeSession(this.id);
			return;
		}
		if (name === "help") {
			const commands = appInfo ? appInfo.join(", ") : "No commands available";
			this.displayOutput(`Available commands: exit, help, ${commands}`);
			this.createNewCommandInput();
			return;
		}

		// If this command is an interactive shell-like command, enter passthrough mode
		const INTERACTIVE_CMDS = new Set(["node", "python", "bash", "sh", "nodejs", "jsh", "pwsh", "powershell"]);
		if (INTERACTIVE_CMDS.has(name.toLowerCase())) {
			this.enterPassthrough();
		}

		const scriptPaths = [`/fs/apps/system/terminal.tapp/scripts/${name.toLowerCase()}.js`, `/apps/terminal.tapp/scripts/${name.toLowerCase()}.js`];
		if (appInfo === null) {
			this.displayOutput("Failed to fetch app info, cannot execute command");
			this.createNewCommandInput();
			this.exitPassthrough();
			return;
		}
		if (!appInfo.includes(name)) {
			this.displayOutput(`Command '${name}' not found! Type 'help' for a list of commands.`);
			this.createNewCommandInput();
			this.exitPassthrough();
			return;
		}
		let scriptRes;
		try {
			scriptRes = await fetch(scriptPaths[0]);
		} catch {
			try {
				scriptRes = await fetch(scriptPaths[1]);
			} catch (error) {
				this.displayOutput(`Failed to fetch script: ${error.message}`);
				this.createNewCommandInput();
				this.exitPassthrough();
				return;
			}
		}
		try {
			const script = await scriptRes.text();
			const fn = new Function("args", "displayOutput", "createNewCommandInput", "displayError", "term", "path", "terbium", "buffer", "setTabTitle", "exitPassthrough", script);
			fn(args, this.displayOutput.bind(this), this.createNewCommandInput.bind(this), this.displayError.bind(this), this.term, this.path, window.parent.tb, window.parent.tb.buffer, this.setName.bind(this), this.exitPassthrough.bind(this));
		} catch (error) {
			this.displayOutput(`Failed to execute command '${name}': ${error.message}`);
			this.createNewCommandInput();
			this.exitPassthrough();
			return;
		}
	}
	resize() {
		try {
			const charWidth = this.term._core._renderService.dimensions.css.cell.width;
			const charHeight = this.term._core._renderService.dimensions.css.cell.height;
			const cols = Math.floor(window.innerWidth / charWidth);
			const rows = Math.floor(window.innerHeight / charHeight);
			this.term.resize(cols, rows);
		} catch (e) {}
	}
	focus() {
		try {
			this.term.focus();
			window.term = this.term;
		} catch (e) {}
	}
	enterPassthrough() {
		this.isProcessingCommands = false;
		this.localEcho = false;
	}
	exitPassthrough() {
		this.isProcessingCommands = true;
		this.localEcho = true;
		// show a new prompt after exiting passthrough
		try {
			this.createNewCommandInput();
		} catch (e) {}
	}
	setName(newName) {
		this.name = newName;
		const win = getWinRoot();
		if (win) {
			const tab = win.querySelector(`.term-tab[data-sid="${this.id}"]`);
			if (tab) {
				tab.querySelector(".label").textContent = newName;
			}
		}
	}
	destroy() {
		try {
			this.term.dispose();
		} catch {}
		try {
			this.container.remove();
		} catch {}
	}
}

const sessions = [];
let activeSession = null;
// Guard to prevent duplicate rapid-close actions (e.g., a single keypress being handled by two handlers)
let _lastCloseTime = 0;
function getWinRoot() {
	try {
		return window.frameElement?.closest("[pid]");
	} catch {
		return null;
	}
}
function addTabToTitle(session) {
	const win = getWinRoot();
	if (!win) return;
	const tabList = win.querySelector(".term-tab-list");
	if (!tabList) return;
	const btn = document.createElement("button");
	btn.className = "term-tab";
	btn.dataset.sid = session.id;
	btn.innerHTML = `<span class=\"label\">${session.name}</span><span class=\"close\">×</span>`;
	tabList.appendChild(btn);
	btn.addEventListener("click", e => {
		if (e.target && e.target.classList && e.target.classList.contains("close")) {
			closeSession(session.id);
		} else {
			switchSession(session.id);
		}
	});
	const add = win.querySelector(".term-add");
	if (add && !add.dataset.bound) {
		add.dataset.bound = "1";
		add.addEventListener("click", () => createSession("Terbium TSH"));
	}
	setActiveTabInTitle();
}
function removeTabFromTitle(id) {
	const win = getWinRoot();
	if (!win) return;
	const tab = win.querySelector(`.term-tab[data-sid="${id}"]`);
	if (tab) tab.remove();
	setActiveTabInTitle();
}
function setActiveTabInTitle() {
	const win = getWinRoot();
	if (!win) return;
	win.querySelectorAll(".term-tab").forEach(t => t.classList.remove("active"));
	if (!activeSession) return;
	const sel = win.querySelector(`.term-tab[data-sid="${activeSession.id}"]`);
	if (sel) sel.classList.add("active");
}
function createSession(name = "Terbium TSH") {
	const isFirst = sessions.length === 0;
	const s = new TerminalSession(name);
	sessions.push(s);
	if (isFirst) {
		try {
			s.term.writeln(`TerbiumOS [Version: ${tb.system.version()}]`);
			s.term.writeln(`Type 'help' for a list of commands.`);
		} catch (e) {
			console.error("Failed to display welcome message", e);
		}
	}
	sessions.forEach(se => {
		se.container.style.display = se === s ? "flex" : "none";
	});
	activeSession = s;
	addTabToTitle(s);
	setActiveTabInTitle();
	return s;
}
function switchSession(id) {
	const s = sessions.find(x => x.id === id);
	if (!s) return;
	sessions.forEach(se => (se.container.style.display = se === s ? "flex" : "none"));
	activeSession = s;
	s.focus();
	setActiveTabInTitle();
}
function switchSessionNext() {
	if (sessions.length <= 1) return;
	const idx = sessions.indexOf(activeSession);
	const next = sessions[(idx + 1) % sessions.length];
	switchSession(next.id);
}
function closeSession(id) {
	const now = Date.now();
	if (now - _lastCloseTime < 250) return;
	_lastCloseTime = now;
	const idx = sessions.findIndex(s => s.id === id);
	if (idx < 0) return;
	const wasActive = sessions[idx] === activeSession;
	sessions[idx].destroy();
	removeTabFromTitle(id);
	sessions.splice(idx, 1);
	if (wasActive) {
		if (sessions.length) {
			switchSession(sessions[Math.max(0, idx - 1)].id);
		} else {
			activeSession = null;
		}
	}
	if (sessions.length === 0) {
		window.parent.tb.window.close();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	createSession("Terbium TSH");
	window.addEventListener("resize", () => {
		sessions.forEach(s => s.resize());
	});
});
window.handleCommand = (...args) => (activeSession ? activeSession.handleCommand(...args) : handleCommand(...args));
window.addEventListener("updPath", e => {
	if (activeSession) activeSession.path = e.detail;
});

/**
 * Resizes the active session terminal to fit the window
 * @returns {void}
 */
function resizeTerm() {
	try {
		if (activeSession && activeSession.term && activeSession.term._core) {
			const charWidth = activeSession.term._core._renderService.dimensions.css.cell.width;
			const charHeight = activeSession.term._core._renderService.dimensions.css.cell.height;
			const cols = Math.floor(window.innerWidth / charWidth);
			const rows = Math.floor(window.innerHeight / charHeight);
			activeSession.term.resize(cols, rows);
		}
	} catch (e) {
		/* ignore */
	}
}
setTimeout(resizeTerm, 50);
window.addEventListener("resize", resizeTerm);

/**
 * The command handler, which executes the commands in `scripts/`
 * @param {string} name The command name
 * @param {argv} args The command's respective args (from yargs-parser)
 * @returns {Promise<void>}
 */
async function handleCommand(name, args) {
	// Prefer activeSession handling if available
	if (typeof activeSession !== "undefined" && activeSession) {
		return activeSession.handleCommand(name, args);
	}
	// If no active session, attempt minimal fallback: try to run script but without a term
	const scriptPaths = [`/fs/apps/system/terminal.tapp/scripts/${name.toLowerCase()}.js`, `/apps/terminal.tapp/scripts/${name.toLowerCase()}.js`];
	const appInfo = await getAppInfo();
	if (appInfo === null) {
		console.error("Failed to fetch app info, cannot execute command");
		return;
	}
	if (!appInfo.includes(name)) {
		console.error(`Command '${name}' not found!`);
		return;
	}
	let scriptRes;
	try {
		scriptRes = await fetch(scriptPaths[0]);
	} catch {
		try {
			scriptRes = await fetch(scriptPaths[1]);
		} catch (error) {
			console.error(`Failed to fetch script: ${error.message}`);
			return;
		}
	}
	try {
		const script = await scriptRes.text();
		const fn = new Function("args", "displayOutput", "createNewCommandInput", "displayError", "term", "path", "terbium", "buffer", script);
		fn(
			args,
			(m, ...s) => console.log(m),
			() => {},
			e => console.error(e),
			undefined,
			path,
			window.parent.tb,
			window.parent.tb.buffer,
		);
	} catch (error) {
		console.error(`Failed to execute command '${name}': ${error.message}`);
		return;
	}
}

// Expose a delegating handler so other frames can always call it
window.handleCommand = (...args) => {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.handleCommand(...args);
	return handleCommand(...args);
};

window.addEventListener("updPath", e => {
	path = e.detail;
});

/**
 * Fetches the app info from the `info.json` file
 * @param {boolean} justNames Whether to return just the app names or the full app info
 * @returns {Promise<string[]|appInfo>} The app names or the full app info
 */
async function getAppInfo(justNames = true) {
	/**
	 * @type {Response}
	 */
	const appInfoResUsr = await fetch(`/fs/apps/user/${await tb.user.username()}/terminal/info.json`);
	/**
	 * @type {Response}
	 */
	const appInfoResSys = await fetch(`/fs/apps/system/terminal.tapp/scripts/info.json`);

	/**
	 * @type {Response}
	 */
	let appInfo;
	try {
		let appInfoUsr = await appInfoResUsr.json();
		let appInfoSys = await appInfoResSys.json();
		if (!Array.isArray(appInfoUsr)) appInfoUsr = appInfoUsr ? [appInfoUsr] : [];
		if (!Array.isArray(appInfoSys)) appInfoSys = appInfoSys ? [appInfoSys] : [];
		appInfo = [...appInfoUsr, ...appInfoSys];
	} catch (error) {
		displayError(`Failed to parse one or more info.json files: ${error.message}`);
		createNewCommandInput();
		return null;
	}

	if (justNames) return appInfo.map(app => app.name);
	return appInfo;
}

/**
 * Displays a styled message to the terminal
 * @param {string} message The message to display, can include %c for styling
 * @param {...string} styles CSS style strings for each %c in the message
 * @returns {Promise<void>}
 */
async function displayOutput(message, ...styles) {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.displayOutput(message, ...styles);
	if (message.includes("%c")) console.log(message.replace(/%c/g, ""));
	else console.log(message);
}
/**
 * Writes the powerline prompt to the terminal
 * @returns {Promise<void>}
 */
async function writePowerline() {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.writePowerline();
	// fallback: no-op
}
/**
 * Creates new command line with a styled prompt
 * @returns {Promise<void>}
 */
async function createNewCommandInput() {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.createNewCommandInput();
	// fallback: no-op
}

/**
 * Logs an error message to terminal
 * @param {string} message The error message that will be displayed on the output
 */
function displayError(message) {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.displayError(message);
	console.error(message);
}

/**
 * Load the current history from the bash history file
 * @returns {Promise<void>}
 */
async function loadHistory() {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.loadHistory();
	// fallback: no-op
}
/**
 * Saves a command to the bash history file
 * @param {string} command The command to save to history
 * @returns {Promise<void>}
 */
async function saveToHistory(command) {
	if (typeof activeSession !== "undefined" && activeSession) return activeSession.saveToHistory(command);
	if (!command.trim()) return;
	commandHistory.push(command);
	if (commandHistory.length > HISTORY_LIMIT) commandHistory.shift();
	historyIndex = commandHistory.length;
	try {
		const username = await tb.user.username();
		const historyPath = `/home/${username}/${HISTORY_FILE}`;
		await window.parent.tb.fs.promises.writeFile(historyPath, commandHistory.join("\n"));
	} catch (error) {
		console.error("Failed to save history", error);
	}
}

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

/**
 * Flag to control whether the terminal should process commands
 */
let isProcessingCommands = true;
tb.setCommandProcessing = status => {
	isProcessingCommands = status;
};
/**
 * Last few commands that have been executed
 */
let commandHistory = [];
let historyIndex = -1;
let path = `/home/${sessionStorage.getItem("currAcc")}/`;
const HISTORY_LIMIT = 1000;
const HISTORY_FILE = ".bash_history";

const term = new Terminal({
	theme: {
		background: "#000000",
		cursor: "#ffffff",
		selection: "#444444",
	},
	cursorBlink: true,
	allowTransparency: true,
	rightClickSelectsWord: true,
});
document.addEventListener("DOMContentLoaded", async () => {
	term.open(document.getElementById("term"));
	term.writeln(`TerbiumOS [Version: ${tb.system.version()}]`);
	term.writeln(`Type 'help' for a list of commands.`);
	window.term = term;

	// Load command history
	await loadHistory();

	term.write("\r\n");
	await writePowerline();

	// Prevent browser context menu on right-click
	term.element.addEventListener('contextmenu', (e) => {
		e.preventDefault();
	});

	// Handle keyboard shortcuts for copy/paste
	term.attachCustomKeyEventHandler(event => {
		if (event.ctrlKey && event.key === "c") {
			if (term.hasSelection()) {
				navigator.clipboard.writeText(term.getSelection()).catch(console.error);
				event.preventDefault();
				return false;
			}
		}
		if (event.ctrlKey && event.key === "v") {
			navigator.clipboard.readText().then(text => {
				for (const c of text) {
					handleChar(c);
				}
			}).catch(console.error);
			event.preventDefault();
			return false;
		}
		// Allow Ctrl+A for select all (when in command mode)
		if (event.ctrlKey && event.key === "a" && isProcessingCommands) {
			event.preventDefault();
			// Select current command line - not implemented yet
			return false;
		}
		return true;
	});

	// Handle paste events
	term.onData(async char => {
		if (!isProcessingCommands) {
			// If SSH or other mode is active, pass through directly
			const dataHandler = term._core._inputHandler;
			if (dataHandler && dataHandler.onData) {
				dataHandler.onData(char);
			}
			return;
		}

		// Handle paste (multiple characters at once)
		if (char.length > 1 && !char.startsWith("\x1b")) {
			// This is pasted text
			for (const c of char) {
				await handleChar(c);
			}
			return;
		}

		await handleChar(char);
	});

	/**
	 * Handle a single character input
	 * @param {string} char The character to handle
	 */
	async function handleChar(char) {
		// Handle arrow keys for history navigation
		// Up arrow
		if (char === "\x1b[A") {
			if (historyIndex > 0 && commandHistory.length > 0) {
				// Clear current line
				term.write("\r\x1b[K");
				await writePowerline();

				historyIndex--;
				accCommand = commandHistory[historyIndex];
				cursorPos = accCommand.length;
				term.write(accCommand);
			}
			return;
		}
		// Down arrow
		if (char === "\x1b[B") {
			// Clear current line
			term.write("\r\x1b[K");
			await writePowerline();

			if (historyIndex < commandHistory.length - 1) {
				historyIndex++;
				accCommand = commandHistory[historyIndex];
				cursorPos = accCommand.length;
				term.write(accCommand);
			} else {
				historyIndex = commandHistory.length;
				accCommand = "";
				cursorPos = 0;
			}
			return;
		}

		// Left arrow - move cursor left
		if (char === "\x1b[D") {
			if (cursorPos > 0) {
				cursorPos--;
				term.write("\x1b[D");
			}
			return;
		}

		// Right arrow - move cursor right
		if (char === "\x1b[C") {
			if (cursorPos < accCommand.length) {
				cursorPos++;
				term.write("\x1b[C");
			}
			return;
		}

		// Home key - move to beginning
		if (char === "\x1b[H" || char === "\x1b[1~") {
			const moveLeft = cursorPos;
			if (moveLeft > 0) {
				term.write(`\x1b[${moveLeft}D`);
				cursorPos = 0;
			}
			return;
		}

		// End key - move to end
		if (char === "\x1b[F" || char === "\x1b[4~") {
			const moveRight = accCommand.length - cursorPos;
			if (moveRight > 0) {
				term.write(`\x1b[${moveRight}C`);
				cursorPos = accCommand.length;
			}
			return;
		}

		// Delete key - delete character at cursor
		if (char === "\x1b[3~") {
			if (cursorPos < accCommand.length) {
				accCommand = accCommand.slice(0, cursorPos) + accCommand.slice(cursorPos + 1);
				// Redraw from cursor to end
				const remaining = accCommand.slice(cursorPos);
				term.write(remaining + " ");
				// Move cursor back
				term.write(`\x1b[${remaining.length + 1}D`);
			}
			return;
		}

		// Backspace
		if (char === "\x7f") {
			if (cursorPos > 0) {
				accCommand = accCommand.slice(0, cursorPos - 1) + accCommand.slice(cursorPos);
				cursorPos--;
				// Move cursor back, redraw rest of line, add space to clear last char
				term.write("\b");
				const remaining = accCommand.slice(cursorPos);
				term.write(remaining + " ");
				// Move cursor back to position
				term.write(`\x1b[${remaining.length + 1}D`);
			}
			return;
		}

		// Enter key
		if (char === "\r") {
			term.writeln("");
			const input = accCommand.trim();
			if (input.length > 0) {
				// Save to history
				await saveToHistory(input);

				const [cmd, ...rawArgs] = input.split(" ");
				const argv = parser(rawArgs);
				argv._raw = rawArgs.join(" ");
				await handleCommand(cmd, argv);
			} else {
				await writePowerline();
			}
			accCommand = "";
			cursorPos = 0;
			return;
		}

		// Regular character input
		if (char >= " " && char <= "~") {
			// Insert character at cursor position
			accCommand = accCommand.slice(0, cursorPos) + char + accCommand.slice(cursorPos);
			cursorPos++;

			// If cursor is at end, just append
			if (cursorPos === accCommand.length) {
				term.write(char);
			} else {
				// Redraw from cursor position
				const remaining = accCommand.slice(cursorPos - 1);
				term.write(remaining);
				// Move cursor back to correct position
				term.write(`\x1b[${remaining.length - 1}D`);
			}
		}
	}

	term.onLineFeed(() => {
		// Reset because of a newline carriage
		accCommand = "";
		cursorPos = 0;
		historyIndex = commandHistory.length;
	});
	term.focus();
});

/**
 * Resizes the terminal to fit the window
 * @returns {void}
 */
function resizeTerm() {
	const charWidth = term._core._renderService.dimensions.css.cell.width;
	const charHeight = term._core._renderService.dimensions.css.cell.height;
	const cols = Math.floor(window.innerWidth / charWidth);
	const rows = Math.floor(window.innerHeight / charHeight);
	term.resize(cols, rows);
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
	/**
	 * The URLs to try to fetch the scripts from
	 * @type {string[]}
	 */
	const scriptPaths = [`/fs/apps/system/terminal.tapp/scripts/${name.toLowerCase()}.js`, `/apps/terminal.tapp/scripts/${name.toLowerCase()}.js`];
	/**
	 * @type {appInfo}
	 */
	const appInfo = await getAppInfo();
	if (appInfo === null) {
		displayError("Failed to fetch app info, cannot execute command");
		createNewCommandInput();
		return;
	}
	// A sanity check to ensure the command exists and is defined properly
	if (!appInfo.includes(name)) {
		displayError(`Command '${name}' not found! Type 'help' for a list of commands.`);
		createNewCommandInput();
		return;
	}
	/**
	 * @type {Response}
	 */
	let scriptRes;
	try {
		scriptRes = await fetch(scriptPaths[0]);
	} catch {
		try {
			scriptRes = await fetch(scriptPaths[1]);
		} catch (error) {
			displayError(`Failed to fetch script: ${error.message}`);
			createNewCommandInput();
			return;
		}
	}
	try {
		const script = await scriptRes.text();
		const fn = new Function("args", "displayOutput", "createNewCommandInput", "displayError", "term", "path", "terbium", "buffer", script);
		fn(args, displayOutput, createNewCommandInput, displayError, term, path, window.parent.tb, window.parent.tb.buffer);
	} catch (error) {
		displayError(`Failed to execute command '${name}': ${error.message}`);
		createNewCommandInput();
		return;
	}
}

window.handleCommand = handleCommand;

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
		term.writeln(styled);
	} else {
		term.writeln(message);
	}
}
/**
 * Writes the powerline prompt to the terminal
 * @returns {Promise<void>}
 */
async function writePowerline() {
	const username = await tb.user.username();
	const userSettings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${username}/settings.json`, "utf8"));
	const accent = await htorgb(userSettings.accent);
	const hostname = JSON.parse(await window.parent.tb.fs.promises.readFile("//system/etc/terbium/settings.json"))["host-name"];

	term.write(`\x1b[38;2;${accent.r};${accent.g};${accent.b}m${username}@${hostname}\x1b[39m ~ ${path}\x1b[0m: `);
}
/**
 * Creates new command line with a styled prompt
 * @returns {Promise<void>}
 */
async function createNewCommandInput() {
	term.write("\r\n");
	await writePowerline();
	// Reset history index for new command being prompted
	historyIndex = commandHistory.length;
}

/**
 * Logs an error message to terminal
 * @param {string} message The error message that will be displayed on the output
 */
function displayError(message) {
	term.writeln(`\x1b[31mERR: ${message}\x1b[0m`);
}

/**
 * Load the current history from the bash history file
 * @returns {Promise<void>}
 */
async function loadHistory() {
	try {
		const username = await tb.user.username();
		const historyPath = `/home/${username}/${HISTORY_FILE}`;
		const data = await window.parent.tb.fs.promises.readFile(historyPath, "utf8");
		commandHistory = data.split("\n").filter(cmd => cmd.trim() !== "");
	} catch {}
	historyIndex = commandHistory.length;
}
/**
 * Saves a command to the bash history file
 * @param {string} command The command to save to history
 * @returns {Promise<void>}
 */
async function saveToHistory(command) {
	if (!command.trim()) return;

	commandHistory.push(command);
	if (commandHistory.length > HISTORY_LIMIT) {
		commandHistory.shift();
	}
	historyIndex = commandHistory.length;

	try {
		const username = await tb.user.username();
		const historyPath = `/home/${username}/${HISTORY_FILE}`;
		await window.parent.tb.fs.promises.writeFile(historyPath, commandHistory.join("\n"));
	} catch (error) {
		console.error("Failed to save history", error);
	}
}

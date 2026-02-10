/**
 * GNU Nano-like text editor for TerbiumOS Terminal
 * @param {Object} args Parsed command arguments
 * @param {Function} displayOutput Function to display output
 * @param {Function} createNewCommandInput Function to create new command input
 * @param {Function} displayError Function to display error
 * @param {Terminal} term The xterm terminal instance
 * @param {string} path Current working directory path
 * @param {Object} terbium Terbium API
 * @param {Object} buffer Buffer API
 */
async function nano(args) {
	const filename = args._[0];
	if (!filename) {
		displayError("nano: filename required");
		createNewCommandInput();
		return;
	}
	const filepath = path + filename;
	let content = "";
	let isNewFile = false;
	try {
		content = await terbium.fs.promises.readFile(filepath, "utf8");
	} catch (e) {
		content = "";
		isNewFile = true;
	}
	let lines = content.split("\n");
	while (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	if (lines.length === 0) {
		lines = [""];
	}
	let currentLine = 0;
	let currentCol = 0;
	let modified = false;
	let viewStart = 0;
	let cutBuffer = "";
	terbium.setCommandProcessing(false);
	term.write("\x1b[2J\x1b[H");
	drawEditor();
	const disposable = term.onData(handleInput);
	function handleInput(data) {
		if (data === "\x1b") {
			return;
		}
		if (data === "\r" || data === "\n") {
			lines.splice(currentLine + 1, 0, lines[currentLine].slice(currentCol));
			lines[currentLine] = lines[currentLine].slice(0, currentCol);
			currentLine++;
			currentCol = 0;
			modified = true;
			drawEditor();
		} else if (data === "\x7f") {
			if (currentCol > 0) {
				lines[currentLine] = lines[currentLine].slice(0, currentCol - 1) + lines[currentLine].slice(currentCol);
				currentCol--;
				modified = true;
				drawEditor();
			} else if (currentLine > 0) {
				currentCol = lines[currentLine - 1].length;
				lines[currentLine - 1] += lines[currentLine];
				lines.splice(currentLine, 1);
				currentLine--;
				modified = true;
				drawEditor();
			}
		} else if (data === "\x1b[A") {
			if (currentLine > 0) {
				currentLine--;
				currentCol = Math.min(currentCol, lines[currentLine].length);
				drawEditor();
			}
		} else if (data === "\x1b[B") {
			if (currentLine < lines.length - 1) {
				currentLine++;
				currentCol = Math.min(currentCol, lines[currentLine].length);
				drawEditor();
			}
		} else if (data === "\x1b[D") {
			if (currentCol > 0) {
				currentCol--;
				drawEditor();
			}
		} else if (data === "\x1b[C") {
			if (currentCol < lines[currentLine].length) {
				currentCol++;
				drawEditor();
			}
		} else if (data === "\x1b[H") {
			currentCol = 0;
			drawEditor();
		} else if (data === "\x1b[F") {
			currentCol = lines[currentLine].length;
			drawEditor();
		} else if (data === "\x1b[3~") {
			if (currentCol < lines[currentLine].length) {
				lines[currentLine] = lines[currentLine].slice(0, currentCol) + lines[currentLine].slice(currentCol + 1);
				modified = true;
				drawEditor();
			} else if (currentLine < lines.length - 1) {
				lines[currentLine] += lines[currentLine + 1];
				lines.splice(currentLine + 1, 1);
				modified = true;
				drawEditor();
			}
		} else if (data.length === 1 && data >= " " && data <= "~") {
			lines[currentLine] = lines[currentLine].slice(0, currentCol) + data + lines[currentLine].slice(currentCol);
			currentCol++;
			modified = true;
			drawEditor();
		} else if (data === "\x07") { // ^G Help
			showHelp();
		} else if (data === "\x0f") { // ^O Write Out
			saveFile();
		} else if (data === "\x0b") { // ^K Cut
			cutBuffer = lines[currentLine];
			lines.splice(currentLine, 1);
			if (lines.length === 0) lines = [""];
			if (currentLine >= lines.length) currentLine = lines.length - 1;
			currentCol = Math.min(currentCol, lines[currentLine].length);
			modified = true;
			drawEditor();
		} else if (data === "\x15") { // ^U Paste
			if (cutBuffer !== "") {
				lines.splice(currentLine + 1, 0, cutBuffer);
				currentLine++;
				currentCol = 0;
				modified = true;
				drawEditor();
			}
		} else if (data === "\x03") { // ^C Cur Pos
			showPosition();
		} else if (data === "\x16") { // ^V Next Page
			const pageSize = term.rows - 3;
			currentLine = Math.min(lines.length - 1, currentLine + pageSize);
			currentCol = Math.min(currentCol, lines[currentLine].length);
			drawEditor();
		} else if (data === "\x19") { // ^Y Prev Page
			const pageSize = term.rows - 3;
			currentLine = Math.max(0, currentLine - pageSize);
			currentCol = Math.min(currentCol, lines[currentLine].length);
			drawEditor();
		} else if (data === "\x18") { // ^X Exit
			if (modified) {
				promptSaveOnExit();
			} else {
				exitEditor();
			}
		}
	}
	function drawEditor() {
		term.write("\x1b[2J\x1b[H");
		const title = `GNU nano ${modified ? "[ Modified ] " : ""}${filename}`;
		const centerCol = Math.max(1, Math.floor((term.cols - title.length) / 2));
		term.write(`\x1b[1;${centerCol}H\x1b[7m${title}\x1b[0m`);
		const maxLines = term.rows - 3;
		viewStart = Math.max(0, Math.min(viewStart, currentLine - maxLines + 1));
		viewStart = Math.max(0, Math.min(viewStart, lines.length - maxLines));
		for (let i = viewStart; i < Math.min(lines.length, viewStart + maxLines); i++) {
			const line = lines[i] || "";
			const row = i - viewStart + 2;
			term.write(`\x1b[${row};1H${line}`);
			term.write(`\x1b[${row};${line.length + 1}H\x1b[K`);
		}
		for (let r = Math.min(lines.length, viewStart + maxLines) - viewStart + 2; r <= term.rows - 1; r++) {
			term.write(`\x1b[${r};1H\x1b[K`);
		}
		term.write(`\x1b[${term.rows};1H^G Get Help  ^O Write Out  ^W Where Is  ^K Cut Text  ^J Justify  ^C Cur Pos  ^X Exit`);
		const cursorRow = currentLine - viewStart + 2;
		const cursorCol = Math.min(currentCol + 1, (lines[currentLine] || "").length + 1);
		term.write(`\x1b[${cursorRow};${cursorCol}H`);
	}
	async function saveFile() {
		try {
			await terbium.fs.promises.writeFile(filepath, lines.join("\n"), "utf8");
			modified = false;
			isNewFile = false;
			drawEditor();
		} catch (e) {
			term.write(`\x1b[${term.rows};1HError: ${e.message}`);
			setTimeout(() => drawEditor(), 2000);
		}
	}
	function showHelp() {
		term.write("\x1b[2J\x1b[H");
		term.writeln("Nano Help");
		term.writeln("");
		term.writeln("^G Get Help    ^O Write Out   ^W Where Is");
		term.writeln("^K Cut Text    ^J Justify     ^C Cur Pos");
		term.writeln("^X Exit        ^U Paste       ^V Next Page");
		term.writeln("^Y Prev Page");
		term.writeln("");
		term.writeln("Press any key to return to editor");
		term.onData(() => {
			drawEditor();
		});
	}
	function showPosition() {
		const lineNum = currentLine + 1;
		const colNum = currentCol + 1;
		const totalLines = lines.length;
		term.write(`\x1b[${term.rows};1HLine ${lineNum}/${totalLines} Col ${colNum}`);
		setTimeout(() => drawEditor(), 2000);
	}
	function promptSaveOnExit() {
		term.write("\x1b[2J\x1b[H");
		term.writeln(`Save modified buffer (ANSWERING "No" WILL DESTROY CHANGES) ?`);
		term.writeln("");
		term.writeln(" Y Yes");
		term.writeln(" N No");
		term.writeln(" ^C Cancel");
		term.writeln("");
		term.write("Save modified buffer? ");
		let response = "";
		const promptDisposable = term.onData((data) => {
			if (data === "\r" || data === "\n") {
				if (response.toLowerCase() === "y" || response.toLowerCase() === "yes") {
					saveFile().then(() => exitEditor());
				} else if (response.toLowerCase() === "n" || response.toLowerCase() === "no") {
					exitEditor();
				} else {
					promptSaveOnExit();
				}
				promptDisposable.dispose();
			} else if (data === "\x03") { // ^C Cancel
				drawEditor();
				promptDisposable.dispose();
			} else if (data === "\x7f") { // Backspace
				if (response.length > 0) {
					response = response.slice(0, -1);
					term.write("\b \b");
				}
			} else if (data.length === 1 && data >= " " && data <= "~") {
				response += data;
				term.write(data);
			}
		});
	}
	function exitEditor() {
		terbium.setCommandProcessing(true);
		disposable.dispose();
		term.write("\x1b[2J\x1b[H");
		createNewCommandInput();
	}
}

nano(args);

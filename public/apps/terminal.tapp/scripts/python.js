/**
 * @typedef {import("yargs-parser").Arguments} argv
 * @typedef {import("xterm").Terminal} Terminal
 */

// Shared Dusk helpers (inlined because terminal scripts run in isolated Function scope)

async function getDuskEnv() {
	const username = await window.parent.tb.user.username();
	return {
		HOME: `/home/${username}`,
		PATH: "/bin",
		TERM: "xterm-256color",
		USER: username,
	};
}

async function readDuskStream(reader, term) {
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			term.write(value);
		}
	} catch (error) {
		console.error("[Dusk Terminal] Stream read error:", error);
	}
}

function setupDuskPty(process, term) {
	// When spawned with pty:true/pty:{cols,rows}, Dusk exposes a PTY master
	// on process.master. Output must be read via master.onMasterData — not
	// process.stdout, which is unused in PTY mode.
	if (process.master) {
		process.master.onMasterData(bytes => {
			term.write(bytes);
		});
	} else {
		// Non-PTY fallback: read from stdout stream
		const reader = process.stdout.getReader();
		readDuskStream(reader, term);
	}

	const inputHandler = term.onData(async data => {
		try {
			if (process.master) {
				// PTY mode: write to master (which forwards to slave stdin)
				process.master.masterWrite(new TextEncoder().encode(data));
			} else {
				// Non-PTY mode: write directly to stdin stream
				await process.stdin.write(new TextEncoder().encode(data));
			}
		} catch (error) {
			console.error("[Dusk Terminal] Input write error:", error);
		}
	});

	const resizeHandler = () => {
		try {
			if (process.master) {
				process.master.resize(term.cols, term.rows);
			} else {
				window.parent.tb.dusk.resizePty(process.pid, term.cols, term.rows);
			}
		} catch (error) {
			console.error("[Dusk Terminal] Resize error:", error);
		}
	};
	window.addEventListener("resize", resizeHandler);

	return {
		cleanup: () => {
			inputHandler.dispose();
			window.removeEventListener("resize", resizeHandler);
		},
	};
}

/**
 * Resolves a path relative to the current working directory.
 * Handles absolute paths, ~/, and relative paths.
 * @param {string} filePath - The path to resolve
 * @param {string} cwd - Current working directory
 * @returns {string} Resolved absolute path
 */
function resolvePath(filePath, cwd) {
	if (filePath.startsWith("/")) {
		return filePath;
	}
	if (filePath.startsWith("~/")) {
		const username = window.parent.sessionStorage.getItem("currAcc");
		return filePath.replace("~", `/home/${username}`);
	}
	// Relative path: join with cwd
	const cwdNormalized = cwd.endsWith("/") ? cwd : cwd + "/";
	return cwdNormalized + filePath;
}

/**
 * CLI for the Python subsystem via Dusk runtime.
 * @param {argv} args
 * @param {Terminal} term
 */
async function python(args, term) {
	if (!window.parent.tb.dusk.isReady) {
		displayOutput("\r\nDusk runtime has not booted yet. Please wait and try again.");
		exitPassthrough();
		return;
	}

	const username = await window.parent.tb.user.username();

	window.parent.tb.setCommandProcessing(false);
	term.focus();

	displayOutput("Starting Python...");
	setTabTitle("Python");

	// args._ does NOT include the command name — it starts at the first real argument.
	// e.g. "python ./script.py arg1" → args._ = ["./script.py", "arg1"]
	const { _: positionalArguments, $0: _commandName, c: cFlag, _raw: _rawArgumentString, ...remainingFlags } = args;
	const positionalArgs = positionalArguments || [];
	const scriptPath = positionalArgs.length > 0 ? String(positionalArgs[0]) : null;
	const cCommand = cFlag ? String(cFlag) : null;

	try {
		let process;
		if (cCommand) {
			// -c mode: execute a string via python.spawn (internally calls python3 -c <cmd>)
			process = await window.parent.tb.dusk.python.spawn(cCommand, {
				pty: { cols: term.cols, rows: term.rows },
				cwd: path,
				env: await getDuskEnv(),
			});
		} else if (scriptPath) {
			// Script file mode: resolve script path and pass all args to python3
			// Example: "python ./script.py arg1 arg2" → args._ = ["./script.py", "arg1", "arg2"]
			const resolvedScriptPath = resolvePath(scriptPath, path);
			const pythonArgs = [resolvedScriptPath, ...positionalArgs.slice(1)];
			process = await window.parent.tb.dusk.spawn("/bin/python3", pythonArgs, {
				pty: { cols: term.cols, rows: term.rows },
				cwd: path,
				env: await getDuskEnv(),
			});
		} else {
			// Interactive REPL mode
			process = await window.parent.tb.dusk.python.spawn(undefined, {
				pty: { cols: term.cols, rows: term.rows },
				cwd: path,
				env: await getDuskEnv(),
			});
		}

		const { cleanup } = setupDuskPty(process, term);

		const exitCode = await process.exit;

		cleanup();
		window.parent.tb.setCommandProcessing(true);
		setTabTitle("Terbium TSH");
		displayOutput(`\r\nPython exited with code ${exitCode}`); // auto-triggers exitPassthrough
	} catch (error) {
		console.error("[Terminal] Python spawn error:", error);
		displayOutput(`\r\nError: ${error.message}`);
		exitPassthrough();
	}
}

python(args, term);

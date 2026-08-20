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
 * CLI for the Dusk Shell (dsh) subsystem.
 * @param {argv} args
 * @param {Terminal} term
 */
async function dsh(args, term) {
	if (!window.parent.tb.dusk.isReady) {
		displayOutput("\r\nDusk runtime has not booted yet. Please wait and try again.");
		createNewCommandInput();
		window.parent.tb.setCommandProcessing(true);
		return;
	}

	const username = await window.parent.tb.user.username();

	window.parent.tb.setCommandProcessing(false);
	term.focus();

	displayOutput("Starting Dusk Shell...");
	setTabTitle("Dusk Shell");

	const shellArgs = (args._ || []).slice(1);
	const command = shellArgs.length > 0 ? shellArgs.join(" ") : undefined;

	try {
		const process = await window.parent.tb.dusk.shell.spawn(command, {
			pty: { cols: term.cols, rows: term.rows },
			cwd: `/home/${username}`,
			env: await getDuskEnv(),
		});

		const { cleanup } = setupDuskPty(process, term);

		const exitCode = await process.exit;

		cleanup();
		window.parent.tb.setCommandProcessing(true);
		setTabTitle("Terbium TSH");
		displayOutput(`\r\nDusk shell exited with code ${exitCode}`);
		createNewCommandInput();
	} catch (error) {
		console.error("[Terminal] Dusk shell spawn error:", error);
		displayOutput(`\r\nError: ${error.message}`);
		window.parent.tb.setCommandProcessing(true);
		createNewCommandInput();
	}
}

dsh(args, term);

/**
 * @typedef {import("yargs-parser").Arguments} argv
 * @typedef {import("xterm").Terminal} Terminal
 */

/**
 * CLI for **Node.js** subsystem
 * @param {argv} args The arguments to pass into **Node.js**
 * @param {Terminal} term - **XTERM.js** terminal instance
 */
async function node(args, term) {
	const webContainer = tb.node.webContainer;

	tb.setCommandProcessing(false);
	term.focus();

	// Check for jsh mode
	const isJshMode = args.j === true || args.jsh === true;

	let command;
	let commandArgs;

	if (tb.node.isReady === false) {
		displayOutput(`\r\nWebContainer has not booted yet. Please wait a few seconds and try again.`);
		createNewCommandInput();
		tb.setCommandProcessing(true);
		return;
	}

	if (isJshMode) {
		displayOutput("Starting WebContainer JavaScript shell...");
		setTabTitle("JSH: Terminal");
		command = "jsh";
		commandArgs = [];
	} else {
		displayOutput("Starting Node.js...");
		setTabTitle("NodeJS");
		command = "node";
		const { _: positionalArguments, $0: commandName, j: shortJshFlag, jsh: longJshFlag, _raw: rawArgumentString, ...remainingFlags } = args;
		const positionalArgs = positionalArguments || [];
		commandArgs = [...positionalArgs];

		// Process the POSIX flags
		for (const [key, value] of Object.entries(remainingFlags)) {
			if (value === false) continue;

			if (key.length === 1) {
				// Handle single letter flags
				commandArgs.push(`-${key}`);
				if (value !== true) {
					commandArgs.push(String(value));
				}
			} else {
				// Long flags
				if (value === true) {
					commandArgs.push(`--${key}`);
				} else {
					commandArgs.push(`--${key}`, String(value));
				}
			}
		}
	}

	const shell = await webContainer.spawn(command, commandArgs, {
		terminal: {
			cols: term.cols,
			rows: term.rows,
		},
	});

	shell.output.pipeTo(
		new WritableStream({
			write(data) {
				term.write(data);
			},
		}),
	);

	const writer = shell.input.getWriter();

	const inputHandler = term.onData(async data => {
		await writer.write(data);
	});

	const resizeHandler = () => {
		shell.resize({
			cols: term.cols,
			rows: term.rows,
		});
	};
	window.addEventListener("resize", resizeHandler);

	// Cleanup
	const exitCode = await shell.exit;
	// Cleanup listeners and handlers
	inputHandler.dispose();
	window.removeEventListener("resize", resizeHandler);
	tb.setCommandProcessing(true);
	setTabTitle("Terbium TSH");
	// Display exit message
	displayOutput(`\r\nWebContainer shell exited with code ${exitCode}`);
	// Give the focus back to the terminal
	createNewCommandInput();
}
node(args, term);

/**
 * Compiled SSH command for TerbiumOS Terminal
 * Copy this file to: /apps/terminal.tapp/scripts/ssh.js
 */

const tbSSH = window.tbSSH;

if (!tbSSH) {
	displayError("TB-SSH library not loaded!");
	createNewCommandInput();
	throw new Error("TB-SSH not available");
}

if (tb.node.isReady === false) {
	displayOutput(`\r\nWebContainer has not booted yet. Please wait a few seconds and try again.`);
	createNewCommandInput();
	tb.setCommandProcessing(true);
	throw new Error("WebContainer not ready");
}

const connectionString = args._[0];
const port = args.p || args.port;
const identityFile = args.i || args.identity;
const verbose = args.v || args.verbose;
const proxyUrl = args.proxy || localStorage.getItem('SSH_PROXY_URL') || 'ws://localhost:3333';

if (!connectionString) {
	displayError("Usage: ssh [user@]hostname [-p port] [-i identity_file] [-v]");
	displayOutput("Examples:");
	displayOutput("  ssh user@example.com");
	displayOutput("  ssh example.com");
	displayOutput("  ssh -p 2222 user@example.com");
	displayOutput("  ssh -i ~/.ssh/id_rsa user@example.com");
	createNewCommandInput();
	throw new Error("No connection string provided");
}

let username, hostname;
if (connectionString.includes("@")) {
	[username, hostname] = connectionString.split("@");
} else {
	hostname = connectionString;
}

(async () => {
	let client = null;
	try {
		displayOutput(`Connecting to ${hostname}...`);
		let usedKey = null;

		const configParser = await tbSSH.loadSSHConfig();

		if (configParser) {
			const hostConfig = configParser.getHost(hostname);
			if (hostConfig && !username && !port && !identityFile) {
				displayOutput(`Using SSH config for host: ${hostname}`);
				if (hostConfig.IdentityFile) {
					// Diagnostic: check if the IdentityFile is readable
					try {
						const pk = await tbSSH.loadPrivateKey(hostConfig.IdentityFile);
						if (pk) {
							usedKey = hostConfig.IdentityFile;
							displayOutput(`SSH config IdentityFile found: ${hostConfig.IdentityFile} keyLen=${pk.length} startsWithBegin=${pk.trim().startsWith('-----BEGIN')}`);
						} else {
							displayOutput(`SSH config IdentityFile not found or unreadable: ${hostConfig.IdentityFile}`);
						}
					} catch (e) {
						displayOutput(`Error reading SSH config IdentityFile ${hostConfig.IdentityFile}: ${e.message}`);
					}
				}
				try {
					client = await tbSSH.createSSHClientFromConfig(hostname);
					if (!client) {
						displayError(`createSSHClientFromConfig returned null or undefined for ${hostname}`);
					}
				} catch (err) {
					displayError(`Error creating SSH client from config for ${hostname}: ${err.message}`);
					if (verbose) displayError(`Stack: ${err.stack}`);
				}
			}
		}



		// Replace procedural client creation with a single robust helper
		async function getClientInternal() {
			// Attempt config-based client first
			if (configParser) {
				const hostConfig = configParser.getHost(hostname);
				if (hostConfig && !username && !port && !identityFile) {
					try {
						const c = await tbSSH.createSSHClientFromConfig(hostname);
						if (c) return c;
						displayError(`createSSHClientFromConfig returned null or undefined for ${hostname}`);
					} catch (e) {
						displayError(`Error creating SSH client from config for ${hostname}: ${e.message}`);
						if (verbose) displayError(`Stack: ${e.stack}`);
					}
				}
			}

			// Build fallback config
			const cfg = {
				host: hostname,
				port: port ? parseInt(port) : 22,
				username: username || sessionStorage.getItem("currAcc") || "root",
				timeout: 60000,
				keepaliveInterval: 60000,
			};

			if (identityFile) {
				const pk = await tbSSH.loadPrivateKey(identityFile);
				if (pk) { cfg.privateKey = pk; usedKey = identityFile; displayOutput(`Using identity file: ${identityFile}`); } else { displayError(`Failed to load identity file: ${identityFile}`); createNewCommandInput(); return null; }
			} else {
				const defaultKeys = ['~/.ssh/id_ed25519','~/.ssh/id_rsa','~/.ssh/id_ecdsa','~/.ssh/id_dsa'];
				for (const kp of defaultKeys) {
					const kd = await tbSSH.loadPrivateKey(kp);
					if (kd) { cfg.privateKey = kd; usedKey = kp; displayOutput(`Using identity file: ${kp}`); break; }
				}
				if (!cfg.privateKey) {
					const password = await new Promise(resolve => {
						term.write("Password: ");
						let pwd = "";
						const disposable = term.onData((data) => {
							const char = data;
							if (char === "\r" || char === "\n") { term.writeln(""); disposable.dispose(); resolve(pwd); } else if (char === "\x7f") { if (pwd.length > 0) { pwd = pwd.slice(0, -1); term.write("\b \b"); } } else if (char >= " " && char <= "~") { pwd += char; term.write("*"); }
						});
					});
					cfg.password = password;
				}
			}

			// Diagnostic
			try { if (cfg.privateKey) { try { displayOutput(`Auth: key (source=${usedKey || 'inline'}) keyLen=${cfg.privateKey.length} startsWithBegin=${cfg.privateKey.trim().startsWith('-----BEGIN')}`); } catch(e) {} } else if (cfg.password) { displayOutput(`Auth: password (provided)`); } else { displayOutput(`Auth: none`); } } catch(e) {}

			// Try WebSocket proxy client (works in WebContainer)
			if (typeof tbSSH.createSSHClientWithProxy === 'function') {
				try {
					displayOutput(`Attempting WebSocket proxy connection via ${proxyUrl}...`);
					const wsClient = tbSSH.createSSHClientWithProxy(cfg, proxyUrl);
					await wsClient.connect();
					if (wsClient.isConnected()) return wsClient;
				} catch (e) {
					displayError(`WebSocket proxy failed: ${e.message}`);
					if (verbose) displayError(`Stack: ${e.stack}`);
				}
			}

			// Try generic factory
			try {
				const c = await tbSSH.createSSHClient(cfg);
				if (c && typeof c.connect === 'function') return c;
				if (c) displayOutput(`createSSHClient returned non-standard object; Client shape: ${Object.getOwnPropertyNames(c).join(', ')}`);
			} catch (e) {
				displayError(`Error creating SSH client for ${hostname}: ${e.message}`);
				if (verbose) displayError(`Stack: ${e.stack}`);
			}

			// Fallback to connectToSSH which will perform connect internally
			if (typeof tbSSH.connectToSSH === 'function') {
				try { const connected = await tbSSH.connectToSSH(cfg.host, cfg.port, cfg.username, cfg.password); if (connected) return connected; } catch (e) { displayError(`connectToSSH fallback failed: ${e.message}`); if (verbose) displayError(`Stack: ${e.stack}`); }
			}

			return null;
		}

		client = await getClientInternal();
		if (!client) { displayError(`Failed to create SSH client for ${hostname}`); createNewCommandInput(); return; }

			// Ensure client was created successfully before attempting to connect
			if (!client || typeof client.connect !== 'function') {
				displayError(`Failed to create SSH client for ${hostname}`);
				// Show what we tried (without exposing secrets)
				try {
					displayOutput(`Tried: host=${hostname} port=${port ? parseInt(port) : 22} username=${username || sessionStorage.getItem("currAcc") || "root"} auth=${usedKey ? `key(source=${usedKey})` : 'password/none'}`);
					if (client) {
						try { displayOutput(`Client shape: ${Object.getOwnPropertyNames(client).join(', ')}`); } catch(e) {}
					}
				} catch(e) {}
				createNewCommandInput();
				return;
			}

		// Connect if needed
		try {
			if (typeof client.connect === 'function') {
				if (!(typeof client.isConnected === 'function' && client.isConnected())) {
					await client.connect();
				}
			} else {
				if (!(typeof client.isConnected === 'function' && client.isConnected())) {
					displayError(`SSH client returned but doesn't expose connect() or isConnected() for ${hostname}`);
					createNewCommandInput();
					return;
				}
			}
		} catch (err) {
			if (client && typeof client.disconnect === 'function') {
				try { client.disconnect(); } catch(e) {}
			}
			displayError(`Failed to connect: ${err.message}`);
			if (verbose) displayError(`Stack: ${err.stack}`);
			createNewCommandInput();
			return;
		}
		displayOutput(`Connected to ${hostname}`);

		// Handle WebSocket client directly (it has setStream and write methods but no shell method)
		const isWebSocketClient = typeof client.setStream === 'function' && typeof client.write === 'function' && typeof client.shell !== 'function';
		
		if (isWebSocketClient) {
			if (window.parent.tb?.setCommandProcessing) {
				window.parent.tb.setCommandProcessing(false);
			}

			// Set up stream for WebSocket client
			const stream = {
				onData: (data) => {
					const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
					term.write(text);
				},
				onClose: () => {
					displayOutput("\r\nConnection closed.");
					client.disconnect();
					if (window.parent.tb?.setCommandProcessing) {
						window.parent.tb.setCommandProcessing(true);
					}
					createNewCommandInput();
				}
			};
			client.setStream(stream);

			// Handle terminal input
			term.onData(data => {
				client.write(data);
			});

			// Handle terminal resize
			term.onResize(({ cols, rows }) => {
				if (typeof client.resize === 'function') {
					client.resize(cols, rows);
				}
			});

			return; // Exit - WebSocket client handles everything
		}

		const terminal = new tbSSH.SSHTerminal(client);
		await terminal.start();

		if (window.parent.tb?.setCommandProcessing) {
			window.parent.tb.setCommandProcessing(false);
		}

		terminal.onData(data => {
			term.write(data);
		});

		terminal.onClose(() => {
			displayOutput("\r\nConnection closed.");
			if (client) client.disconnect();

			try { if (typeof inputDisposable !== 'undefined' && inputDisposable) inputDisposable.dispose(); } catch(e) {}

			if (window.parent.tb?.setCommandProcessing) {
				window.parent.tb.setCommandProcessing(true);
			}

			createNewCommandInput();
		});

		const inputDisposable = term.onData((data) => {
			terminal.write(data);
		});
	} catch (error) {
		if (client) client.disconnect();
		displayError(`Failed to connect: ${error.message}`);
		if (verbose) {
			displayError(`Stack: ${error.stack}`);
		}
		createNewCommandInput();
	}
})();

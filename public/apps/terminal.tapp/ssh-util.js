(() => {
	"use strict";
	var e = {};
	(e.d = (n, t) => {
		for (var r in t) e.o(t, r) && !e.o(n, r) && Object.defineProperty(n, r, { enumerable: !0, get: t[r] });
	}),
		(e.o = (e, n) => Object.prototype.hasOwnProperty.call(e, n));
	var n = {};
	function t(e, n, t, r, o, s, i) {
		try {
			var c = e[s](i),
				a = c.value;
		} catch (e) {
			t(e);
			return;
		}
		c.done ? n(a) : Promise.resolve(a).then(r, o);
	}
	function r(e) {
		return function () {
			var n = this,
				r = arguments;
			return new Promise(function (o, s) {
				var i = e.apply(n, r);
				function c(e) {
					t(i, o, s, c, a, "next", e);
				}
				function a(e) {
					t(i, o, s, c, a, "throw", e);
				}
				c(void 0);
			});
		};
	}
	e.d(n, { default: () => w });
	function o(e, n, t) {
		return n in e ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (e[n] = t), e;
	}
	function s(e, n) {
		var t,
			r,
			o,
			s = {
				label: 0,
				sent: function () {
					if (1 & o[0]) throw o[1];
					return o[1];
				},
				trys: [],
				ops: [],
			},
			i = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype),
			c = Object.defineProperty;
		return (
			c(i, "next", { value: a(0) }),
			c(i, "throw", { value: a(1) }),
			c(i, "return", { value: a(2) }),
			"function" == typeof Symbol &&
				c(i, Symbol.iterator, {
					value: function () {
						return this;
					},
				}),
			i
		);
		function a(c) {
			return function (a) {
				var l = [c, a];
				if (t) throw TypeError("Generator is already executing.");
				for (; i && ((i = 0), l[0] && (s = 0)), s; )
					try {
						if (((t = 1), r && (o = 2 & l[0] ? r.return : l[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, l[1])).done)) return o;
						switch (((r = 0), o && (l = [2 & l[0], o.value]), l[0])) {
							case 0:
							case 1:
								o = l;
								break;
							case 4:
								return s.label++, { value: l[1], done: !1 };
							case 5:
								s.label++, (r = l[1]), (l = [0]);
								continue;
							case 7:
								(l = s.ops.pop()), s.trys.pop();
								continue;
							default:
								if (!(o = (o = s.trys).length > 0 && o[o.length - 1]) && (6 === l[0] || 2 === l[0])) {
									s = 0;
									continue;
								}
								if (3 === l[0] && (!o || (l[1] > o[0] && l[1] < o[3]))) {
									s.label = l[1];
									break;
								}
								if (6 === l[0] && s.label < o[1]) {
									(s.label = o[1]), (o = l);
									break;
								}
								if (o && s.label < o[2]) {
									(s.label = o[2]), s.ops.push(l);
									break;
								}
								o[2] && s.ops.pop(), s.trys.pop();
								continue;
						}
						l = n.call(e, s);
					} catch (e) {
						(l = [6, e]), (r = 0);
					} finally {
						t = o = 0;
					}
				if (5 & l[0]) throw l[1];
				return { value: l[0] ? l[1] : void 0, done: !0 };
			};
		}
	}
	var i = (function () {
		var e;
		function n(e) {
			if (!(this instanceof n)) throw TypeError("Cannot call a class as a function");
			o(this, "config", void 0),
				o(this, "webContainer", null),
				o(this, "sshProcess", null),
				o(this, "connected", !1),
				o(this, "authenticated", !1),
				o(this, "dataCallbacks", []),
				o(this, "closeCallbacks", []),
				o(this, "connectionPromise", null),
				o(this, "_didRetry", !1),
				(this.config = (function (e) {
					for (var n = 1; n < arguments.length; n++) {
						var t = null != arguments[n] ? arguments[n] : {},
							r = Object.keys(t);
						"function" == typeof Object.getOwnPropertySymbols &&
							(r = r.concat(
								Object.getOwnPropertySymbols(t).filter(function (e) {
									return Object.getOwnPropertyDescriptor(t, e).enumerable;
								}),
							)),
							r.forEach(function (n) {
								o(e, n, t[n]);
							});
					}
					return e;
				})({ port: 22, timeout: 6e4, keepaliveInterval: 6e4 }, e));
		}
		return (
			(e = [
				{
					key: "connect",
					value: function () {
						return r(function () {
							return s(this, function (e) {
								return this.connectionPromise || (this.connectionPromise = this.doConnect()), [2, this.connectionPromise];
							});
						}).call(this);
					},
				},
				{
					key: "doConnect",
					value: function () {
						return r(function () {
							var e, n, t, r, o, i, c, a, l, u, f, h;
							return s(this, function (s) {
								switch (s.label) {
									case 0:
										if ((console.log("[SSH] Starting connection to", this.config.host + ":" + this.config.port), !(null == (t = window.tb || (null == (e = window.parent) ? void 0 : e.tb)) || null == (n = t.node) ? void 0 : n.webContainer)))
											throw (console.error("[SSH] WebContainer not available"), Error("WebContainer not available. Ensure WebContainer is initialized."));
										if ((console.log("[SSH] WebContainer found"), (this.webContainer = t.node.webContainer), t.node.isReady)) return [3, 2];
										return (
											console.log("[SSH] Waiting for WebContainer to be ready..."),
											[
												4,
												new Promise(function (e) {
													var n = setInterval(function () {
														t.node.isReady && (clearInterval(n), console.log("[SSH] WebContainer is ready"), e());
													}, 100);
												}),
											]
										);
									case 1:
										return s.sent(), [3, 3];
									case 2:
										console.log("[SSH] WebContainer already ready"), (s.label = 3);
									case 3:
										return console.log("[SSH] Ensuring ssh2 is installed..."), [4, this.ensureSSH2Installed()];
									case 4:
										return (
											s.sent(),
											console.log("[SSH] ssh2 installation check complete"),
											console.log("[SSH] Generating SSH client script..."),
											console.log("[SSH] Script generated, length:", (r = this.generateSSHScript()).length),
											console.log("[SSH] Writing script to", (o = "ssh-client.mjs")),
											[4, this.webContainer.fs.writeFile(o, r)]
										);
									case 5:
										s.sent(), console.log("[SSH] Script written successfully"), (s.label = 6);
									case 6:
										return s.trys.push([6, 8, , 9]), [4, this.webContainer.fs.readFile(o, "utf-8")];
									case 7:
										return console.log("[SSH] Verified script exists, length:", s.sent().length), [3, 9];
									case 8:
										return console.error("[SSH] Failed to verify script file:", s.sent()), [3, 9];
									case 9:
										return console.log("[SSH] Spawning Node.js process with script:", o), [4, this.webContainer.spawn("node", [o])];
									case 10:
										(i = s.sent()), (this.sshProcess = i), console.log("[SSH] Process spawned, starting to read output..."), (c = i.output.getReader()), this.readOutput(c), console.log("[SSH] Waiting for connection confirmation..."), (a = 0), (l = 3), (s.label = 11);
									case 11:
										if (!(a < l)) return [3, 17];
										s.label = 12;
									case 12:
										return s.trys.push([12, 14, , 16]), a++, console.log("[SSH] waitForConnection attempt ".concat(a, "/").concat(l, " (timeout=").concat(this.config.timeout, "ms)")), [4, this.waitForConnection()];
									case 13:
										return s.sent(), [3, 17];
									case 14:
										if ((console.error("[SSH] waitForConnection failed:", (u = s.sent())), a >= l)) throw (console.error("[SSH] All retry attempts failed"), u);
										(this._didRetry = !0), this.config.timeout, (this.config.timeout = Math.max(2 * this.config.timeout, 12e4)), console.log("[SSH] Retrying connection with increased timeout:", this.config.timeout);
										try {
											this.sshProcess && "function" == typeof this.sshProcess.kill && this.sshProcess.kill();
										} catch (e) {
											console.warn("[SSH] Error killing previous process:", e);
										}
										return [4, this.webContainer.spawn("node", [o])];
									case 15:
										return (f = s.sent()), (this.sshProcess = f), (h = f.output.getReader()), this.readOutput(h), [3, 16];
									case 16:
										return [3, 11];
									case 17:
										return (this.connected = !0), (this.authenticated = !0), [2];
								}
							});
						}).call(this);
					},
				},
				{
					key: "ensureSSH2Installed",
					value: function () {
						return r(function () {
							var e, n, t;
							return s(this, function (r) {
								switch (r.label) {
									case 0:
										return r.trys.push([0, 7, , 11]), console.log("[SSH] Checking for existing package.json..."), [4, this.webContainer.fs.readFile("/package.json", "utf-8")];
									case 1:
										if ((console.log("[SSH] Found package.json:", (t = JSON.parse(r.sent()))), !(!(null == (e = t.dependencies) ? void 0 : e.ssh2) || !(null == (n = t.dependencies) ? void 0 : n.sshpk)))) return [3, 5];
										return (
											console.log("[SSH] Adding ssh2 and sshpk to dependencies if missing..."),
											(t.dependencies = t.dependencies || {}),
											(t.dependencies.ssh2 = t.dependencies.ssh2 || "^1.15.0"),
											(t.dependencies.sshpk = t.dependencies.sshpk || "^1.16.1"),
											[4, this.webContainer.fs.writeFile("/package.json", JSON.stringify(t, null, 2))]
										);
									case 2:
										return r.sent(), console.log("[SSH] Running npm install..."), [4, this.webContainer.spawn("npm", ["install"])];
									case 3:
										return [4, r.sent().exit];
									case 4:
										return console.log("[SSH] npm install completed with exit code:", r.sent()), [3, 6];
									case 5:
										console.log("[SSH] ssh2 and sshpk already installed"), (r.label = 6);
									case 6:
										return [3, 11];
									case 7:
										return r.sent(), console.log("[SSH] No package.json found or error, creating new one..."), [4, this.webContainer.fs.writeFile("/package.json", JSON.stringify({ name: "ssh-client", dependencies: { ssh2: "^1.15.0" } }, null, 2))];
									case 8:
										return r.sent(), console.log("[SSH] Running npm install for new package.json..."), [4, this.webContainer.spawn("npm", ["install"])];
									case 9:
										return [4, r.sent().exit];
									case 10:
										return console.log("[SSH] npm install completed with exit code:", r.sent()), [3, 11];
									case 11:
										return [2];
								}
							});
						}).call(this);
					},
				},
				{
					key: "generateSSHScript",
					value: function () {
						var e = this.config,
							n = e.host,
							t = e.port,
							r = e.username,
							o = e.password,
							s = e.privateKey,
							i = e.passphrase,
							c = [];
						c.push("host: ".concat(JSON.stringify(n))),
							c.push("port: ".concat(t)),
							c.push("username: ".concat(JSON.stringify(r))),
							o && c.push("password: ".concat(JSON.stringify(o))),
							s && c.push("privateKey: ".concat(JSON.stringify(s))),
							i && c.push("passphrase: ".concat(JSON.stringify(i))),
							c.push("readyTimeout: ".concat(this.config.timeout)),
							c.push("keepaliveInterval: ".concat(this.config.keepaliveInterval)),
							c.push(
								"algorithms: {\n			kex: [\n				'diffie-hellman-group14-sha1',\n				'diffie-hellman-group-exchange-sha256',\n				'ecdh-sha2-nistp256',\n				'ecdh-sha2-nistp384',\n				'ecdh-sha2-nistp521',\n				'curve25519-sha256',\n				'curve25519-sha256@libssh.org',\n				'diffie-hellman-group1-sha1',\n				'diffie-hellman-group-exchange-sha1'\n			],\n			cipher: [\n				'aes128-ctr','aes192-ctr','aes256-ctr','aes128-gcm','aes128-gcm@openssh.com','aes256-gcm','aes256-gcm@openssh.com','aes128-cbc','aes192-cbc','aes256-cbc','3des-cbc'\n			],\n			hmac: ['hmac-sha2-256','hmac-sha2-512','hmac-sha1'],\n			serverHostKey: ['ssh-rsa','rsa-sha2-512','rsa-sha2-256','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521','ssh-dss']\n		}",
							),
							c.push("debug: (msg) => console.log('[ssh2-debug]', msg)"),
							c.push("hostVerifier: (hash) => { console.log('[ssh2] hostVerifier:', hash); return true; }");
						var a = "{\n			".concat(c.join(",\n		"), "\n		}");
						return "\nconsole.log('[SSH Script] Starting...');\nimport { Client } from 'ssh2';\nimport net from 'net';\nconsole.log('[SSH Script] ssh2 module loaded');\n\nconst conn = new Client();\nlet shellStream = null;\n\nconsole.log('[SSH Script] Setting up event handlers...');\n\nconn.on('ready', () => {\n	console.log('[SSH Script] Connection ready event fired');\n	console.log('___SSH_CONNECTED___');\n\n	conn.shell((err, stream) => {\n		if (err) {\n			console.error('[SSH Script] Shell error:', err.message);\n			console.error('___SSH_ERROR___', err.message);\n			process.exit(1);\n		}\n\n		console.log('[SSH Script] Shell stream established');\n		shellStream = stream;\n\n		stream.on('data', (data) => {\n			process.stdout.write(data);\n		});\n\n		stream.on('close', () => {\n			console.log('___SSH_CLOSED___');\n			conn.end();\n		});\n\n		stream.stderr.on('data', (data) => {\n			process.stderr.write(data);\n		});\n\n		process.stdin.setEncoding('utf8');\n		process.stdin.on('data', (data) => {\n			if (shellStream) {\n				shellStream.write(data);\n			}\n		});\n	});\n});\n\nconn.on('error', (err) => {\n	console.error('[SSH Script] Connection error:', err);\n	console.error('___SSH_ERROR___', err.message);\n	// dump helpful debug info\n	try { console.error('[SSH Script] conn properties:', JSON.stringify({ localAddr: conn.localAddress, localPort: conn.localPort })); } catch(e) {}\n	process.exit(1);\n});\n\nconn.on('banner', (msg) => {\n	console.log('[SSH Script] Server banner:', msg);\n});\n\nconn.on('close', () => {\n	console.log('___SSH_CLOSED___');\n});\n\nconsole.log('[SSH Script] Preparing connection config...');\nconst config = ".concat(
							a,
							";\n\n// expose the client identification (ident) to mimic OpenSSH for compatibility\nif (!config.ident) {\n	config.ident = 'SSH-2.0-OpenSSH_8.9p1';\n}\n\n// If OPENSSH private key format is present, try converting to PEM (sshpk must be installed in the container)\ntry {\n	if (config.privateKey && typeof config.privateKey === 'string' && config.privateKey.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {\n		try {\n			const { default: sshpk } = await import('sshpk');\n			const keyObj = sshpk.parsePrivateKey(config.privateKey, 'openssh');\n			config.privateKey = keyObj.toString('pem');\n			console.log('[SSH Script] Converted OPENSSH private key to PEM format');\n		} catch (e) {\n			console.log('[SSH Script] Key conversion failed:', e && e.message);\n		}\n	}\n} catch(e) { console.log('[SSH Script] Key conversion check error:', e && e.message); }\n\nconsole.log('[SSH Script] Connecting with config:', JSON.stringify({...config, password: config.password ? '***' : undefined, privateKey: config.privateKey ? '***' : undefined, algorithms: config.algorithms}, null, 2));\n\n// TCP banner check to verify server sends SSH identification\nasync function checkServerBanner(host, port, timeoutMs = 10000) {\n	return new Promise((resolve) => {\n		const sock = net.createConnection(port, host, () => {});\n		sock.setEncoding('utf8');\n		let buffer = '';\n		let done = false;\n		sock.on('data', (chunk) => {\n			buffer += chunk;\n			if (buffer.indexOf('\\n') !== -1 && !done) {\n				done = true;\n				const line = buffer.split(/\\r?\\n/)[0];\n				console.log('[SSH Script] Server banner (raw):', line);\n				sock.destroy();\n				resolve(line);\n			}\n		});\n		sock.on('error', (err) => {\n			if (!done) { done = true; console.log('[SSH Script] Server banner check error:', err.message); resolve(null); }\n		});\n		setTimeout(() => {\n			if (!done) { done = true; console.log('[SSH Script] Server banner check timeout'); try { sock.destroy(); } catch(e) {} resolve(null); }\n		}, timeoutMs);\n	});\n}\n\ntry {\n	const banner = await checkServerBanner(config.host, config.port, 10000);\n	if (!banner) {\n		console.log('[SSH Script] No server banner received before connect; proceeding anyway');\n	}\n\n	conn.connect(config);\n	console.log('[SSH Script] connect() called, waiting for events...');\n} catch (e) {\n	console.error('[SSH Script] Top-level error during connect flow:', e);\n	console.error('___SSH_ERROR___', e && e.message ? e.message : String(e));\n	process.exit(1);\n}\n",
						);
					},
				},
				{
					key: "readOutput",
					value: function (e) {
						return r(function () {
							var n, t;
							return s(this, function (r) {
								switch (r.label) {
									case 0:
										console.log("[SSH] Starting output reader..."), (r.label = 1);
									case 1:
										r.trys.push([1, 5, , 6]),
											(t = function () {
												var t, r, o, i, c, a;
												return s(this, function (s) {
													switch (s.label) {
														case 0:
															return [4, e.read()];
														case 1:
															if (((r = (t = s.sent()).done), (o = t.value), r)) return console.log("[SSH] Output stream ended"), [2, "break"];
															if (((i = void 0), (c = void 0), "string" == typeof o)) (c = o), (i = new TextEncoder().encode(o)), console.log("[SSH] Received string output:", c.substring(0, 200));
															else {
																var l;
																if (null != (l = Uint8Array) && "u" > typeof Symbol && l[Symbol.hasInstance] ? !l[Symbol.hasInstance](o) : !(o instanceof l))
																	return console.error("[SSH] Unexpected value type:", void 0 === o ? "undefined" : o && "u" > typeof Symbol && o.constructor === Symbol ? "symbol" : typeof o), [2, "continue"];
																(i = o), console.log("[SSH] Received bytes output:", (c = new TextDecoder().decode(o)).substring(0, 200));
															}
															if (c.includes("___SSH_CONNECTED___")) return [2, "continue"];
															if (c.includes("___SSH_CLOSED___")) return n.handleClose(), [2, "continue"];
															if (c.includes("___SSH_ERROR___")) return console.error("SSH Error:", null == (a = c.split("___SSH_ERROR___")[1]) ? void 0 : a.trim()), [2, "continue"];
															return (
																n.dataCallbacks.forEach(function (e) {
																	return e(i);
																}),
																[2]
															);
													}
												});
											}),
											(r.label = 2);
									case 2:
										return (
											(n = this),
											[
												5,
												(function (e) {
													var n = "function" == typeof Symbol && Symbol.iterator,
														t = n && e[n],
														r = 0;
													if (t) return t.call(e);
													if (e && "number" == typeof e.length)
														return {
															next: function () {
																return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e };
															},
														};
													throw TypeError(n ? "Object is not iterable." : "Symbol.iterator is not defined.");
												})(t()),
											]
										);
									case 3:
										if ("break" === r.sent()) return [3, 4];
										return [3, 2];
									case 4:
										return [3, 6];
									case 5:
										return console.error("Error reading SSH output:", r.sent()), this.handleClose(), [3, 6];
									case 6:
										return [2];
								}
							});
						}).call(this);
					},
				},
				{
					key: "waitForConnection",
					value: function () {
						return r(function () {
							var e;
							return s(this, function (n) {
								return (
									(e = this),
									[
										2,
										new Promise(function (n, t) {
											console.log("[SSH] Setting up connection timeout:", e.config.timeout + "ms");
											var r = setTimeout(function () {
													console.error("[SSH] Connection timeout! No SSH_CONNECTED marker received within", e.config.timeout + "ms"), console.error("[SSH] Buffer contents:", o), t(Error("SSH connection timeout"));
												}, e.config.timeout),
												o = "",
												s = function (t) {
													var i = new TextDecoder().decode(t);
													if (((o += i), console.log("[SSH] Checking for connection marker in chunk:", i.substring(0, 100)), o.includes("___SSH_CONNECTED___"))) {
														console.log("[SSH] Connection marker found!"), clearTimeout(r);
														var c = e.dataCallbacks.indexOf(s);
														c > -1 && e.dataCallbacks.splice(c, 1), n();
													}
												};
											console.log("[SSH] Registered connection check callback"), e.dataCallbacks.push(s);
										}),
									]
								);
							});
						}).call(this);
					},
				},
				{
					key: "handleClose",
					value: function () {
						(this.connected = !1),
							(this.authenticated = !1),
							this.closeCallbacks.forEach(function (e) {
								return e();
							});
					},
				},
				{
					key: "exec",
					value: function (e) {
						return r(function () {
							var n, t, r, o, i, c, a, l, u, f, h;
							return s(this, function (s) {
								switch (s.label) {
									case 0:
										if (!this.authenticated) throw Error("Not authenticated");
										return (
											(n = "\nconst { Client } = require('ssh2');\nconst conn = new Client();\n\nconn.on('ready', () => {\n	conn.exec("
												.concat(
													JSON.stringify(e),
													", (err, stream) => {\n		if (err) {\n			console.error('ERROR:', err.message);\n			process.exit(1);\n		}\n		\n		let stdout = '';\n		let stderr = '';\n		\n		stream.on('data', (data) => {\n			stdout += data.toString();\n		});\n		\n		stream.stderr.on('data', (data) => {\n			stderr += data.toString();\n		});\n		\n		stream.on('close', (code) => {\n			console.log('___STDOUT___' + stdout + '___END_STDOUT___');\n			console.log('___STDERR___' + stderr + '___END_STDERR___');\n			console.log('___EXIT_CODE___' + code + '___END_EXIT_CODE___');\n			conn.end();\n		});\n	});\n});\n\nconn.connect(",
												)
												.concat(JSON.stringify({ host: this.config.host, port: this.config.port, username: this.config.username, password: this.config.password, privateKey: this.config.privateKey, passphrase: this.config.passphrase }), ");\n")),
											(t = "ssh-exec.js"),
											[4, this.webContainer.fs.writeFile(t, n)]
										);
									case 1:
										return s.sent(), [4, this.webContainer.spawn("node", [t])];
									case 2:
										(r = s.sent()), (o = ""), (i = r.output.getReader()), (s.label = 3);
									case 3:
										return [4, i.read()];
									case 4:
										if (((a = (c = s.sent()).done), (l = c.value), a)) return [3, 5];
										return (o += new TextDecoder().decode(l)), [3, 3];
									case 5:
										return [4, r.exit];
									case 6:
										return (
											s.sent(),
											(u = o.match(RegExp("___STDOUT___(.*?)___END_STDOUT___", "s"))),
											(f = o.match(RegExp("___STDERR___(.*?)___END_STDERR___", "s"))),
											(h = o.match(/___EXIT_CODE___(\d+)___END_EXIT_CODE___/)),
											[2, { stdout: u ? u[1] : "", stderr: f ? f[1] : "", exitCode: h ? parseInt(h[1]) : 0 }]
										);
								}
							});
						}).call(this);
					},
				},
				{
					key: "shell",
					value: function () {
						return r(function () {
							var e;
							return s(this, function (n) {
								if (((e = this), !this.authenticated)) throw Error("Not authenticated");
								return [
									2,
									{
										write: function (n) {
											if (e.sshProcess)
												try {
													var t = "string" == typeof n ? new TextEncoder().encode(n) : n,
														r = e.sshProcess.input.getWriter();
													r.write(t), r.releaseLock();
												} catch (e) {
													console.error("Error writing to SSH:", e);
												}
										},
										onData: function (n) {
											e.dataCallbacks.push(n);
										},
										onClose: function (n) {
											e.closeCallbacks.push(n);
										},
										close: function () {
											e.sshProcess && e.sshProcess.kill();
										},
									},
								];
							});
						}).call(this);
					},
				},
				{
					key: "sftp",
					value: function () {
						return r(function () {
							return s(this, function (e) {
								throw Error("SFTP not yet implemented in WebContainer version");
							});
						})();
					},
				},
				{
					key: "disconnect",
					value: function () {
						if (this.sshProcess)
							try {
								this.sshProcess.kill();
							} catch (e) {
								console.error("Error killing SSH process:", e);
							}
						(this.connected = !1), (this.authenticated = !1), (this.connectionPromise = null);
					},
				},
				{
					key: "isConnected",
					value: function () {
						return this.connected;
					},
				},
				{
					key: "isAuthenticated",
					value: function () {
						return this.authenticated;
					},
				},
			]),
			(function (e, n) {
				for (var t = 0; t < n.length; t++) {
					var r = n[t];
					(r.enumerable = r.enumerable || !1), (r.configurable = !0), "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
				}
			})(n.prototype, e),
			n
		);
	})();
	function c(e, n, t, r, o, s, i) {
		try {
			var c = e[s](i),
				a = c.value;
		} catch (e) {
			t(e);
			return;
		}
		c.done ? n(a) : Promise.resolve(a).then(r, o);
	}
	function a(e, n, t) {
		return n in e ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (e[n] = t), e;
	}
	var l = (function () {
		var e;
		function n(e) {
			var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "ws://localhost:3333";
			if (!(this instanceof n)) throw TypeError("Cannot call a class as a function");
			a(this, "config", void 0),
				a(this, "ws", null),
				a(this, "stream", null),
				a(this, "connected", !1),
				a(this, "proxyUrl", void 0),
				(this.config = (function (e) {
					for (var n = 1; n < arguments.length; n++) {
						var t = null != arguments[n] ? arguments[n] : {},
							r = Object.keys(t);
						"function" == typeof Object.getOwnPropertySymbols &&
							(r = r.concat(
								Object.getOwnPropertySymbols(t).filter(function (e) {
									return Object.getOwnPropertyDescriptor(t, e).enumerable;
								}),
							)),
							r.forEach(function (n) {
								a(e, n, t[n]);
							});
					}
					return e;
				})({ timeout: 6e4, keepaliveInterval: 6e4 }, e)),
				(this.proxyUrl = t);
		}
		return (
			(e = [
				{
					key: "connect",
					value: function () {
						var e;
						return ((e = function () {
							var e;
							return (function (e, n) {
								var t,
									r,
									o,
									s = {
										label: 0,
										sent: function () {
											if (1 & o[0]) throw o[1];
											return o[1];
										},
										trys: [],
										ops: [],
									},
									i = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype),
									c = Object.defineProperty;
								return (
									c(i, "next", { value: a(0) }),
									c(i, "throw", { value: a(1) }),
									c(i, "return", { value: a(2) }),
									"function" == typeof Symbol &&
										c(i, Symbol.iterator, {
											value: function () {
												return this;
											},
										}),
									i
								);
								function a(c) {
									return function (a) {
										var l = [c, a];
										if (t) throw TypeError("Generator is already executing.");
										for (; i && ((i = 0), l[0] && (s = 0)), s; )
											try {
												if (((t = 1), r && (o = 2 & l[0] ? r.return : l[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, l[1])).done)) return o;
												switch (((r = 0), o && (l = [2 & l[0], o.value]), l[0])) {
													case 0:
													case 1:
														o = l;
														break;
													case 4:
														return s.label++, { value: l[1], done: !1 };
													case 5:
														s.label++, (r = l[1]), (l = [0]);
														continue;
													case 7:
														(l = s.ops.pop()), s.trys.pop();
														continue;
													default:
														if (!(o = (o = s.trys).length > 0 && o[o.length - 1]) && (6 === l[0] || 2 === l[0])) {
															s = 0;
															continue;
														}
														if (3 === l[0] && (!o || (l[1] > o[0] && l[1] < o[3]))) {
															s.label = l[1];
															break;
														}
														if (6 === l[0] && s.label < o[1]) {
															(s.label = o[1]), (o = l);
															break;
														}
														if (o && s.label < o[2]) {
															(s.label = o[2]), s.ops.push(l);
															break;
														}
														o[2] && s.ops.pop(), s.trys.pop();
														continue;
												}
												l = n.call(e, s);
											} catch (e) {
												(l = [6, e]), (r = 0);
											} finally {
												t = o = 0;
											}
										if (5 & l[0]) throw l[1];
										return { value: l[0] ? l[1] : void 0, done: !0 };
									};
								}
							})(this, function (n) {
								return (
									(e = this),
									[
										2,
										new Promise(function (n, t) {
											try {
												var r = "".concat(e.config.host, ":").concat(e.config.port || 22),
													o = "".concat(e.proxyUrl, "/").concat(r);
												console.log("[SSH WS] Connecting to proxy:", o), (e.ws = new WebSocket(o)), (e.ws.binaryType = "arraybuffer");
												var s = setTimeout(function () {
													e.connected || t(Error("WebSocket connection timeout"));
												}, e.config.timeout);
												(e.ws.onopen = function () {
													console.log("[SSH WS] WebSocket connected to proxy"), clearTimeout(s);
													var n,
														t = JSON.stringify({ type: "ssh-auth", username: e.config.username, password: e.config.password, privateKey: e.config.privateKey, passphrase: e.config.passphrase });
													null == (n = e.ws) || n.send(t);
												}),
													(e.ws.onmessage = function (r) {
														if ("string" == typeof r.data)
															try {
																var o = JSON.parse(r.data);
																"connected" === o.type ? (console.log("[SSH WS] SSH connection established"), (e.connected = !0), n()) : "error" === o.type && (console.error("[SSH WS] SSH error:", o.message), t(Error(o.message)));
															} catch (e) {
																console.error("[SSH WS] Failed to parse message:", e);
															}
														else if (e.stream && e.stream.onData) {
															var s = new Uint8Array(r.data);
															e.stream.onData(s);
														}
													}),
													(e.ws.onerror = function (e) {
														console.error("[SSH WS] WebSocket error:", e), t(Error("WebSocket connection failed"));
													}),
													(e.ws.onclose = function () {
														console.log("[SSH WS] WebSocket closed"), (e.connected = !1), e.stream && e.stream.onClose && e.stream.onClose();
													});
											} catch (e) {
												t(e);
											}
										}),
									]
								);
							});
						}),
						function () {
							var n = this,
								t = arguments;
							return new Promise(function (r, o) {
								var s = e.apply(n, t);
								function i(e) {
									c(s, r, o, i, a, "next", e);
								}
								function a(e) {
									c(s, r, o, i, a, "throw", e);
								}
								i(void 0);
							});
						}).call(this);
					},
				},
				{
					key: "write",
					value: function (e) {
						this.ws && this.ws.readyState === WebSocket.OPEN ? ("string" == typeof e ? this.ws.send(e) : this.ws.send(e.buffer)) : console.error("[SSH WS] Cannot write - WebSocket not open");
					},
				},
				{
					key: "resize",
					value: function (e, n) {
						if (this.ws && this.ws.readyState === WebSocket.OPEN) {
							var t = JSON.stringify({ type: "resize", cols: e, rows: n });
							this.ws.send(t);
						}
					},
				},
				{
					key: "disconnect",
					value: function () {
						console.log("[SSH WS] Disconnecting..."), (this.connected = !1), this.ws && (this.ws.close(), (this.ws = null));
					},
				},
				{
					key: "getStream",
					value: function () {
						return this.stream;
					},
				},
				{
					key: "setStream",
					value: function (e) {
						this.stream = e;
					},
				},
				{
					key: "isConnected",
					value: function () {
						var e;
						return this.connected && (null == (e = this.ws) ? void 0 : e.readyState) === WebSocket.OPEN;
					},
				},
			]),
			(function (e, n) {
				for (var t = 0; t < n.length; t++) {
					var r = n[t];
					(r.enumerable = r.enumerable || !1), (r.configurable = !0), "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
				}
			})(n.prototype, e),
			n
		);
	})();
	function u(e, n, t) {
		return n in e ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (e[n] = t), e;
	}
	function f(e) {
		for (var n = 1; n < arguments.length; n++) {
			var t = null != arguments[n] ? arguments[n] : {},
				r = Object.keys(t);
			"function" == typeof Object.getOwnPropertySymbols &&
				(r = r.concat(
					Object.getOwnPropertySymbols(t).filter(function (e) {
						return Object.getOwnPropertyDescriptor(t, e).enumerable;
					}),
				)),
				r.forEach(function (n) {
					u(e, n, t[n]);
				});
		}
		return e;
	}
	var h = (function () {
		var e;
		function n(e) {
			if (!(this instanceof n)) throw TypeError("Cannot call a class as a function");
			u(this, "config", []), this.parse(e);
		}
		return (
			(e = [
				{
					key: "parse",
					value: function (e) {
						var n = e.split("\n"),
							t = null,
							r = !0,
							o = !1,
							s = void 0;
						try {
							for (var i, c = n[Symbol.iterator](); !(r = (i = c.next()).done); r = !0) {
								var a = i.value,
									l = a.indexOf("#");
								if ((-1 !== l && (a = a.substring(0, l)), (a = a.trim()))) {
									var u = a.match(/^Host\s+(.+)$/i);
									if (u) {
										t && this.config.push(t), (t = { Host: u[1].trim() });
										continue;
									}
									if (t) {
										var f = a.split(/\s+/),
											h = f[0],
											p = f.slice(1).join(" ");
										switch (h.toLowerCase()) {
											case "hostname":
												t.HostName = p;
												break;
											case "port":
												t.Port = parseInt(p, 10);
												break;
											case "user":
												t.User = p;
												break;
											case "identityfile":
												t.IdentityFile = p.replace(/^~/, "/home/".concat(sessionStorage.getItem("currAcc")));
												break;
											case "proxycommand":
												t.ProxyCommand = p;
												break;
											case "proxyjump":
												t.ProxyJump = p;
												break;
											case "forwardagent":
												t.ForwardAgent = "yes" === p.toLowerCase();
												break;
											case "serveraliveinterval":
												t.ServerAliveInterval = parseInt(p, 10);
												break;
											case "serveralivecountmax":
												t.ServerAliveCountMax = parseInt(p, 10);
												break;
											case "connecttimeout":
												t.ConnectTimeout = parseInt(p, 10);
												break;
											default:
												t[h] = p;
										}
									}
								}
							}
						} catch (e) {
							(o = !0), (s = e);
						} finally {
							try {
								r || null == c.return || c.return();
							} finally {
								if (o) throw s;
							}
						}
						t && this.config.push(t);
					},
				},
				{
					key: "getHost",
					value: function (e) {
						var n = { Host: e, HostName: e, Port: 22, User: sessionStorage.getItem("currAcc") || "root" },
							t = !0,
							r = !1,
							o = void 0;
						try {
							for (var s, i = this.config[Symbol.iterator](); !(t = (s = i.next()).done); t = !0) {
								var c = s.value;
								this.matchPattern(e, c.Host) && (n = f({}, n, c));
							}
						} catch (e) {
							(r = !0), (o = e);
						} finally {
							try {
								t || null == i.return || i.return();
							} finally {
								if (r) throw o;
							}
						}
						var a = this.config.find(function (n) {
							return n.Host === e;
						});
						return a && (n = f({}, n, a)), n.HostName && n.HostName === n.Host, n;
					},
				},
				{
					key: "matchPattern",
					value: function (e, n) {
						var t = n.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
						return new RegExp("^".concat(t, "$")).test(e);
					},
				},
				{
					key: "getAllHosts",
					value: function () {
						return this.config;
					},
				},
			]),
			(function (e, n) {
				for (var t = 0; t < n.length; t++) {
					var r = n[t];
					(r.enumerable = r.enumerable || !1), (r.configurable = !0), "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
				}
			})(n.prototype, e),
			n
		);
	})();
	function p(e, n, t, r, o, s, i) {
		try {
			var c = e[s](i),
				a = c.value;
		} catch (e) {
			t(e);
			return;
		}
		c.done ? n(a) : Promise.resolve(a).then(r, o);
	}
	function d(e) {
		return function () {
			var n = this,
				t = arguments;
			return new Promise(function (r, o) {
				var s = e.apply(n, t);
				function i(e) {
					p(s, r, o, i, c, "next", e);
				}
				function c(e) {
					p(s, r, o, i, c, "throw", e);
				}
				i(void 0);
			});
		};
	}
	function S(e, n, t) {
		return n in e ? Object.defineProperty(e, n, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (e[n] = t), e;
	}
	function g(e, n) {
		var t,
			r,
			o,
			s = {
				label: 0,
				sent: function () {
					if (1 & o[0]) throw o[1];
					return o[1];
				},
				trys: [],
				ops: [],
			},
			i = Object.create(("function" == typeof Iterator ? Iterator : Object).prototype),
			c = Object.defineProperty;
		return (
			c(i, "next", { value: a(0) }),
			c(i, "throw", { value: a(1) }),
			c(i, "return", { value: a(2) }),
			"function" == typeof Symbol &&
				c(i, Symbol.iterator, {
					value: function () {
						return this;
					},
				}),
			i
		);
		function a(c) {
			return function (a) {
				var l = [c, a];
				if (t) throw TypeError("Generator is already executing.");
				for (; i && ((i = 0), l[0] && (s = 0)), s; )
					try {
						if (((t = 1), r && (o = 2 & l[0] ? r.return : l[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, l[1])).done)) return o;
						switch (((r = 0), o && (l = [2 & l[0], o.value]), l[0])) {
							case 0:
							case 1:
								o = l;
								break;
							case 4:
								return s.label++, { value: l[1], done: !1 };
							case 5:
								s.label++, (r = l[1]), (l = [0]);
								continue;
							case 7:
								(l = s.ops.pop()), s.trys.pop();
								continue;
							default:
								if (!(o = (o = s.trys).length > 0 && o[o.length - 1]) && (6 === l[0] || 2 === l[0])) {
									s = 0;
									continue;
								}
								if (3 === l[0] && (!o || (l[1] > o[0] && l[1] < o[3]))) {
									s.label = l[1];
									break;
								}
								if (6 === l[0] && s.label < o[1]) {
									(s.label = o[1]), (o = l);
									break;
								}
								if (o && s.label < o[2]) {
									(s.label = o[2]), s.ops.push(l);
									break;
								}
								o[2] && s.ops.pop(), s.trys.pop();
								continue;
						}
						l = n.call(e, s);
					} catch (e) {
						(l = [6, e]), (r = 0);
					} finally {
						t = o = 0;
					}
				if (5 & l[0]) throw l[1];
				return { value: l[0] ? l[1] : void 0, done: !0 };
			};
		}
	}
	function y() {
		return d(function () {
			var e, n, t;
			return g(this, function (r) {
				switch (r.label) {
					case 0:
						if (!(null == (t = window.tb || (null == (e = window.parent) ? void 0 : e.tb)) || null == (n = t.node) ? void 0 : n.webContainer)) throw Error("WebContainer not available");
						if (t.node.isReady) return [3, 2];
						return [
							4,
							new Promise(function (e) {
								var n = setInterval(function () {
									t.node.isReady && (clearInterval(n), e());
								}, 100);
							}),
						];
					case 1:
						r.sent(), (r.label = 2);
					case 2:
						return [2];
				}
			});
		})();
	}
	function v(e) {
		return d(function () {
			return g(this, function (n) {
				switch (n.label) {
					case 0:
						return [4, y()];
					case 1:
						return n.sent(), [2, new i(e)];
				}
			});
		})();
	}
	function b() {
		return d(function () {
			var e, n, t, r;
			return g(this, function (o) {
				switch (o.label) {
					case 0:
						if ((o.trys.push([0, 2, , 3]), !(n = sessionStorage.getItem("currAcc")) || ((t = "/home/".concat(n, "/.ssh/config")), !(null == (r = window.tb || (null == (e = window.parent) ? void 0 : e.tb)) ? void 0 : r.fs)))) return [2, null];
						return [4, r.fs.promises.readFile(t, "utf8")];
					case 1:
						return [2, new h(o.sent())];
					case 2:
						return o.sent(), [2, null];
					case 3:
						return [2];
				}
			});
		})();
	}
	function m(e) {
		return d(function () {
			var n, t, r, o, s;
			return g(this, function (i) {
				switch (i.label) {
					case 0:
						if ((i.trys.push([0, 2, , 3]), !(t = sessionStorage.getItem("currAcc")) || ((r = e.replace(/^~/, "/home/".concat(t))), !(null == (o = window.tb || (null == (n = window.parent) ? void 0 : n.tb)) ? void 0 : o.fs)))) return [2, null];
						return [4, o.fs.promises.readFile(r, "utf8")];
					case 1:
						return [2, i.sent()];
					case 2:
						return (s = i.sent()), console.error("Failed to load private key: ".concat(s)), [2, null];
					case 3:
						return [2];
				}
			});
		})();
	}
	let w = {
		createSSHClient: v,
		createSSHClientWithProxy: function (e, n) {
			return new l(e, n);
		},
		connectToSSH: function (e, n, t, r) {
			return d(function () {
				var o;
				return g(this, function (s) {
					switch (s.label) {
						case 0:
							return [4, v({ host: e, port: n, username: t, password: r, timeout: 6e4, keepaliveInterval: 6e4 })];
						case 1:
							return [4, (o = s.sent()).connect()];
						case 2:
							return s.sent(), [2, o];
					}
				});
			})();
		},
		SSHTerminal: (function () {
			var e;
			function n(e) {
				if (!(this instanceof n)) throw TypeError("Cannot call a class as a function");
				S(this, "client", void 0), S(this, "channel", null), (this.client = e);
			}
			return (
				(e = [
					{
						key: "start",
						value: function () {
							return d(function () {
								var e;
								return g(this, function (n) {
									switch (n.label) {
										case 0:
											return (e = this), [4, this.client.shell()];
										case 1:
											return (e.channel = n.sent()), [2];
									}
								});
							}).call(this);
						},
					},
					{
						key: "write",
						value: function (e) {
							if (!this.channel) throw Error("Terminal not started");
							this.channel.write(e);
						},
					},
					{
						key: "onData",
						value: function (e) {
							if (!this.channel) throw Error("Terminal not started");
							this.channel.onData(function (n) {
								e(new TextDecoder().decode(n));
							});
						},
					},
					{
						key: "onClose",
						value: function (e) {
							if (!this.channel) throw Error("Terminal not started");
							this.channel.onClose(e);
						},
					},
					{
						key: "close",
						value: function () {
							this.channel && this.channel.close();
						},
					},
				]),
				(function (e, n) {
					for (var t = 0; t < n.length; t++) {
						var r = n[t];
						(r.enumerable = r.enumerable || !1), (r.configurable = !0), "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
					}
				})(n.prototype, e),
				n
			);
		})(),
		loadSSHConfig: b,
		loadPrivateKey: m,
		createSSHClientFromConfig: function (e, n) {
			return d(function () {
				var t, r, o, s;
				return g(this, function (i) {
					switch (i.label) {
						case 0:
							return [4, b()];
						case 1:
							if (!(r = null == (t = i.sent()) ? void 0 : t.getHost(e))) return [2, null];
							if (
								((o = (function (e) {
									for (var n = 1; n < arguments.length; n++) {
										var t = null != arguments[n] ? arguments[n] : {},
											r = Object.keys(t);
										"function" == typeof Object.getOwnPropertySymbols &&
											(r = r.concat(
												Object.getOwnPropertySymbols(t).filter(function (e) {
													return Object.getOwnPropertyDescriptor(t, e).enumerable;
												}),
											)),
											r.forEach(function (n) {
												S(e, n, t[n]);
											});
									}
									return e;
								})({ host: r.HostName || e, port: r.Port || 22, username: r.User || sessionStorage.getItem("currAcc") || "root", timeout: 1e3 * (r.ConnectTimeout || 30), keepaliveInterval: 1e3 * (r.ServerAliveInterval || 30) }, n)),
								!(r.IdentityFile && !o.privateKey && !o.password))
							)
								return [3, 3];
							return [4, m(r.IdentityFile)];
						case 2:
							(s = i.sent()) && (o.privateKey = s), (i.label = 3);
						case 3:
							return [4, v(o)];
						case 4:
							return [2, i.sent()];
					}
				});
			})();
		},
	};
	"u" > typeof window && (y().catch(console.error), console.log("TB-SSH initialized (WebContainer mode)")), (window.tbSSH = n.default);
})();
//# sourceMappingURL=main.js.map

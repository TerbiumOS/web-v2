import { Terminal } from "https://esm.sh/@xterm/xterm";

const tb = window.tb || window.parent.tb || {};
const sessions = [];
let activeSession = null;
let lastCloseTime = 0;

const getWindowRoot = () => {
	try {
		return window.frameElement?.closest("[pid]") || null;
	} catch {
		return null;
	}
};

const getUsername = async () => {
	try {
		return await window.parent.tb.user.username();
	} catch {
		return "Guest";
	}
};

const getHostname = async () => {
	try {
		const text = await window.parent.tb.fs.promises.readFile("//system/etc/terbium/settings.json", "utf8");
		return JSON.parse(text)["host-name"] || "terbium";
	} catch {
		return "terbium";
	}
};

const getSettings = async username => {
	try {
		const text = await window.parent.tb.fs.promises.readFile(`/home/${username}/settings.json`, "utf8");
		return JSON.parse(text);
	} catch {
		return {};
	}
};

const getTerbiumVersion = () => {
	try {
		return window.parent.tb.system.version();
	} catch {
		return "unknown";
	}
};

const normalizeColor = value => {
	if (typeof value !== "string") return null;
	const color = value.trim();
	if (/^#[0-9a-f]{6}$/i.test(color)) return color;
	if (/^#[0-9a-f]{3}$/i.test(color))
		return `#${color
			.slice(1)
			.split("")
			.map(part => part + part)
			.join("")}`;
	return null;
};

class TerminalSession {
	constructor(name = "Terbium DSH") {
		this.id = `dsh-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		this.name = name;
		this.process = null;
		this.disposed = false;
		this.container = document.createElement("div");
		this.container.className = "term-session";
		this.container.style.display = "none";
		document.getElementById("term").appendChild(this.container);

		this.term = new Terminal({
			theme: { background: "#000000", foreground: "#ffffff", cursor: "#ffffff", selection: "#444444" },
			cursorBlink: true,
			allowTransparency: true,
			rightClickSelectsWord: true,
		});
		this.term.open(this.container);
		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(this.container);
		this.bindKeys();
		this.start();
	}

	bindKeys() {
		this.term.element.addEventListener("contextmenu", event => event.preventDefault());
		this.term.attachCustomKeyEventHandler(event => {
			if (event.ctrlKey && event.key === "c" && this.term.hasSelection()) {
				navigator.clipboard.writeText(this.term.getSelection()).catch(console.error);
				event.preventDefault();
				return false;
			}
			if (event.ctrlKey && event.key === "v") {
				navigator.clipboard
					.readText()
					.then(text => this.writeInput(text))
					.catch(console.error);
				event.preventDefault();
				return false;
			}
			if (event.altKey && event.key === "t") {
				event.preventDefault();
				createSession();
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
		this.term.onData(data => void this.writeInput(data));
		this.term.onResize(({ cols, rows }) => {
			try {
				this.process?.master?.resize(cols, rows);
			} catch (error) {
				console.error("[Terbium DSH] Resize error:", error);
			}
		});
	}

	async writeInput(data) {
		if (!this.process || this.disposed) return;
		try {
			await this.process.stdin.write(new TextEncoder().encode(data));
		} catch (error) {
			console.error("[Terbium DSH] Input error:", error);
		}
	}

	async start() {
		try {
			if (!window.parent.tb.dusk.isReady) await window.parent.tb.dusk.start();
			const username = await getUsername();
			const hostname = await getHostname();
			const settings = await getSettings(username);
			const accent = normalizeColor(settings.accent || settings["accent-color"] || settings.accentColor);
			if (accent) this.term.options.theme = { ...this.term.options.theme, foreground: "#ffffff", cursor: accent, selection: `${accent}66` };
			this.process = await window.parent.tb.dusk.spawn("/bin/dsh", [], {
				cwd: `/home/${username}`,
				env: {
					HOME: `/home/${username}`,
					PATH: "/usr/local/bin:/usr/bin:/bin",
					TERM: "xterm-256color",
					USER: username,
					LOGNAME: username,
					HOSTNAME: hostname,
					TERBIUM_ACCENT: accent || "",
					TERBIUM_VERSION: getTerbiumVersion(),
					SHELL: "/bin/sh",
				},
				pty: { cols: this.term.cols, rows: this.term.rows },
			});

			this.process.master?.onMasterData(bytes => {
				if (bytes.length) this.term.write(bytes);
			});
			this.drain(this.process.stdout);
			this.drain(this.process.stderr);
			this.process.exit.then(code => {
				if (!this.disposed) this.term.write(`\r\n[shell exited with code ${code}]\r\n`);
				this.dispose();
			});
			this.setName("Terbium DSH");
			this.resize();
		} catch (error) {
			this.term.write(`\x1b[31mTerbium DSH failed to start: ${String(error)}\x1b[0m\r\n`);
		}
	}

	async drain(stream) {
		if (!stream) return;
		const reader = stream.getReader();
		try {
			while (true) {
				const { done } = await reader.read();
				if (done) break;
			}
		} catch {}
	}

	resize() {
		try {
			if (!this.container.isConnected || this.container.clientWidth < 1 || this.container.clientHeight < 1) return;
			const rect = this.container.getBoundingClientRect();
			const cell = this.term._core?._renderService?.dimensions?.css?.cell;
			if (!cell?.width || !cell?.height) {
				requestAnimationFrame(() => this.resize());
				return;
			}
			const cols = Math.max(2, Math.floor(rect.width / cell.width));
			const rows = Math.max(2, Math.floor(rect.height / cell.height));
			if (cols !== this.term.cols || rows !== this.term.rows) this.term.resize(cols, rows);
			this.process?.master?.resize(cols, rows);
		} catch (error) {
			console.error("[Terbium DSH] Resize error:", error);
		}
	}

	focus() {
		this.term.focus();
		window.term = this.term;
	}

	setName(name) {
		this.name = name;
		const tab = getWindowRoot()?.querySelector(`.term-tab[data-sid="${this.id}"]`);
		if (tab) tab.querySelector(".label").textContent = name;
	}

	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		this.resizeObserver?.disconnect();
		try {
			this.process?.kill();
		} catch {}
		this.term.dispose();
		this.container.remove();
	}
}

function addTab(session) {
	const root = getWindowRoot();
	const list = root?.querySelector(".term-tab-list");
	if (!list) return;
	const tab = document.createElement("button");
	tab.className = "term-tab";
	tab.dataset.sid = session.id;
	tab.innerHTML = '<span class="label"></span><span class="close">×</span>';
	tab.querySelector(".label").textContent = session.name;
	tab.addEventListener("click", event => {
		if (event.target.classList.contains("close")) closeSession(session.id);
		else switchSession(session.id);
	});
	list.appendChild(tab);
	updateTabs();
}

function updateTabs() {
	const root = getWindowRoot();
	root?.querySelectorAll(".term-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.sid === activeSession?.id));
}

function createSession() {
	const session = new TerminalSession();
	sessions.push(session);
	sessions.forEach(item => {
		item.container.style.display = item === session ? "flex" : "none";
	});
	activeSession = session;
	addTab(session);
	session.focus();
}

function switchSession(id) {
	const session = sessions.find(item => item.id === id);
	if (!session) return;
	sessions.forEach(item => {
		item.container.style.display = item === session ? "flex" : "none";
	});
	activeSession = session;
	session.focus();
	updateTabs();
}

function switchSessionNext() {
	if (sessions.length < 2) return;
	const index = sessions.indexOf(activeSession);
	switchSession(sessions[(index + 1) % sessions.length].id);
}

function closeSession(id) {
	if (Date.now() - lastCloseTime < 250) return;
	lastCloseTime = Date.now();
	const index = sessions.findIndex(item => item.id === id);
	if (index < 0) return;
	const wasActive = sessions[index] === activeSession;
	sessions[index].dispose();
	getWindowRoot()?.querySelector(`.term-tab[data-sid="${id}"]`)?.remove();
	sessions.splice(index, 1);
	if (wasActive && sessions.length) switchSession(sessions[Math.max(0, index - 1)].id);
	else updateTabs();
	if (!sessions.length) window.parent.tb.window.close();
}

window.addEventListener("resize", () => sessions.forEach(session => session.resize()));
window.addEventListener("beforeunload", () => sessions.forEach(session => session.dispose()), { once: true });

document.addEventListener("DOMContentLoaded", () => {
	const add = getWindowRoot()?.querySelector(".term-add");
	if (add) add.addEventListener("click", () => createSession());
	createSession();
});

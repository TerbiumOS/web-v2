import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

type TbApi = {
	system: {
		version(): string | number | unknown;
		exportfs(): void | Promise<void>;
		openApp(name: string): Promise<void>;
	};
	process: {
		list(): Record<string, { pid: number; name?: string; type?: string }>;
		kill(pid: number | string): void;
	};
	proxy: { get(): Promise<string>; set(name: string): Promise<boolean> };
	node: { isReady: boolean; start(): Promise<void> | void; stop(): Promise<boolean> };
	fs: { promises: { readFile(path: string, encoding?: string): Promise<unknown> } };
};

const CLI_VERSION = "2.0.0";
const HELP = `${[
	`Terbium System CLI v${CLI_VERSION}`,
	"Usage: tb <command> [arguments]",
	"",
	"  help [command]                 Show command help",
	"  restart [--force] [--skip-prompt]  Restart TerbiumOS",
	"  lock                           Return to the login screen",
	"  process list                   List Terbium processes",
	"  process kill <pid>             Stop a process (alias: proc)",
	"  system version                 Print TerbiumOS version (alias: sys)",
	"  system exportfs                Export filesystem backup",
	"  application list               List installed applications (alias: app)",
	"  application run <name>         Open an installed application",
	"  network proxy active           Show active proxy",
	"  network proxy set <name>       Change active proxy (alias: net)",
	"  node start|stop|restart        Control Node.js container",
].join("\n")}\n`;

const getApi = (): TbApi => {
	const api = (globalThis as typeof globalThis & { window?: { tb?: TbApi } }).window?.tb;
	if (!api) throw new Error("Terbium API is unavailable");
	return api;
};

const run = async ({ args }: HostBinaryContext): Promise<HostBinaryResult> => {
	const api = getApi();
	const [first, second, ...rest] = args;
	const rootCommand = first === "sys" ? "system" : first === "app" ? "application" : first === "proc" ? "process" : first;
	try {
		if (!rootCommand || rootCommand === "--help" || rootCommand === "-h") return { status: 0, stdout: HELP };
		if (rootCommand === "help") {
			const topic = second;
			if (!topic) return { status: 0, stdout: HELP };
			const lines = HELP.split("\n").filter(line => line.toLowerCase().includes(topic.toLowerCase()));
			return { status: 0, stdout: `${lines.length ? lines.join("\n") : `No help for ${topic}.`}\n` };
		}
		if (rootCommand === "restart" || rootCommand === "reboot") {
			if (args.includes("--skip-prompt") || args.includes("-s") || args.includes("--force") || args.includes("-f")) {
				if (args.includes("--force") || args.includes("-f")) window.sessionStorage.clear();
				else window.sessionStorage.setItem("logged-in", "false");
				window.location.reload();
				return { status: 0, stdout: "Restarting TerbiumOS...\n" };
			}
			const ok = await confirm("Are you sure you want to restart TerbiumOS?");
			if (!ok) return { status: 1, stderr: "tb: restart cancelled\n" };
			window.sessionStorage.setItem("logged-in", "false");
			window.location.reload();
			return { status: 0, stdout: "Restarting TerbiumOS...\n" };
		}
		if (rootCommand === "lock") {
			window.sessionStorage.setItem("logged-in", "false");
			window.location.reload();
			return { status: 0, stdout: "Locking session...\n" };
		}
		if (rootCommand === "system" && (second === "version" || second === "ver")) return { status: 0, stdout: `TerbiumOS version ${api.system.version()}\n` };
		if (rootCommand === "system" && second === "exportfs") {
			await api.system.exportfs();
			return { status: 0, stdout: "Filesystem export started.\n" };
		}
		if (rootCommand === "system" && second === "restartNode") {
			if (api.node.isReady) await api.node.stop();
			await api.node.start();
			return { status: 0, stdout: "Node.js container restarted.\n" };
		}
		if (rootCommand === "process" && second === "list") {
			const processes = Object.values(api.process.list());
			return { status: 0, stdout: processes.map(proc => `${String(proc.pid).padEnd(6)} ${proc.type ?? "process"}\t${proc.name ?? "(unnamed)"}`).join("\n") + (processes.length ? "\n" : "No processes found.\n") };
		}
		if (rootCommand === "process" && (second === "kill" || second === "delete")) {
			const pid = rest[0];
			if (!pid || !/^\d+$/.test(pid)) return { status: 2, stderr: "Usage: tb process kill <pid>\n" };
			api.process.kill(Number(pid));
			return { status: 0, stdout: `Sent terminate request to process ${pid}.\n` };
		}
		if (rootCommand === "application" && second === "list") {
			const installed = JSON.parse(String(await api.fs.promises.readFile("/apps/installed.json", "utf8"))) as Array<{ name: string; config: string }>;
			return { status: 0, stdout: installed.map(app => `${app.name}\t${app.config}`).join("\n") + (installed.length ? "\n" : "No applications installed.\n") };
		}
		if (rootCommand === "application" && (second === "run" || second === "open")) {
			const name = rest[0];
			if (!name) return { status: 2, stderr: "Usage: tb application run <name>\n" };
			await api.system.openApp(name.replaceAll("_", " "));
			return { status: 0, stdout: `Opened ${name}.\n` };
		}
		if (rootCommand === "network" && second === "proxy") {
			if (rest[0] === "active") return { status: 0, stdout: `Active proxy: ${await api.proxy.get()}\n` };
			if (rest[0] === "set" && rest[1]) {
				const success = await api.proxy.set(rest[1]);
				return success ? { status: 0, stdout: `Successfully set active proxy to ${rest[1]}.\n` } : { status: 1, stderr: `Could not set proxy to ${rest[1]}.\n` };
			}
			return { status: 2, stderr: "Usage: tb network proxy active|set <name>\n" };
		}
		if (rootCommand === "node") {
			if (second === "start") {
				if (api.node.isReady) return { status: 0, stdout: "Node.js container is already running.\n" };
				await api.node.start();
				return { status: 0, stdout: "Node.js container started.\n" };
			}
			if (second === "stop") {
				if (!api.node.isReady) return { status: 0, stdout: "Node.js container is already stopped.\n" };
				await api.node.stop();
				return { status: 0, stdout: "Node.js container stopped.\n" };
			}
			if (second === "restart") {
				if (api.node.isReady) await api.node.stop();
				await api.node.start();
				return { status: 0, stdout: "Node.js container restarted.\n" };
			}
			return { status: 2, stderr: "Usage: tb node start|stop|restart\n" };
		}
		return { status: 2, stderr: `tb: unknown command '${args.join(" ")}'\nTry 'tb help'.\n` };
	} catch (error) {
		return { status: 1, stderr: `tb: ${error instanceof Error ? error.message : String(error)}\n` };
	}
};

const confirm = (message: string): Promise<boolean> =>
	new Promise(resolve => {
		const dialog = (globalThis as typeof globalThis & { window?: { tb?: { dialog?: { Permissions(props: { title: string; message: string; onOk: () => void; onCancel: () => void }): void } } } }).window?.tb?.dialog?.Permissions;
		if (!dialog) return resolve(false);
		dialog({ title: "Confirm restart", message, onOk: () => resolve(true), onCancel: () => resolve(false) });
	});

export const tb: HostBinary = run;
export default tb;

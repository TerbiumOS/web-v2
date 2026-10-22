import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

type ProcessInfo = { pid: number; name?: string; type?: string; wid?: string | number | null; argv?: string[] };
type ProcessApi = {
	process: {
		list(): Record<string, ProcessInfo>;
		kill(pid: string | number): void;
	};
	dusk?: {
		processManager?: {
			activePids(): number[];
			getProcess(pid: number): { kill(): void } | undefined;
			getProcessRecord(pid: number): { ppid: number } | undefined;
			_deliverSignal(pid: number, signal: string): void;
		};
	};
};

const HELP = "Usage: pkill [-e|-f|-x] [-n|-o] [-signal] <pattern>\n       pkill -P <pid>\n       kill [-signal] <pid>\n       pkill -l\n       taskkill [/PID pid | /IM name] [/F]\n";

const run = ({ args }: HostBinaryContext, killMode = false): HostBinaryResult => {
	const api = (globalThis as typeof globalThis & { window?: { tb?: ProcessApi } }).window?.tb;
	if (!api) return { status: 1, stderr: "pkill: Terbium process API unavailable\n" };
	const taskkillMode = args[0]?.startsWith("/") ?? false;
	if (args.includes("-h") || args.includes("--help") || args.includes("/?")) return { status: 0, stdout: HELP };
	const listMode = args.includes("-l") || args.includes("--list") || (taskkillMode && args.length === 1) || (args.length === 1 && args[0]?.toLowerCase() === "list");
	let force = false;
	let exact = false;
	let full = false;
	let newest = false;
	let oldest = false;
	let echo = false;
	let signal = "TERM";
	let targetPid: number | undefined;
	let parentPid: number | undefined;
	let targetImage: string | undefined;
	let pattern: string | undefined;
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg) continue;
		const upper = arg.toUpperCase();
		if (taskkillMode && upper === "/PID") targetPid = Number(args[++i]);
		else if (taskkillMode && upper === "/IM") targetImage = args[++i];
		else if (arg === "-P") parentPid = Number(args[++i]);
		else if (killMode && arg === "-s") signal = (args[++i] ?? "TERM").replace(/^SIG/i, "").toUpperCase();
		else if (upper === "/F") force = true;
		else if (/^-(?:\d+|SIG[A-Z]+|TERM|INT|KILL|HUP|QUIT|ABRT|USR1|USR2)$/.test(upper)) signal = upper.replace(/^-SIG/, "").replace(/^-/, "");
		else if (arg === "-x") exact = true;
		else if (arg === "-f") full = true;
		else if (arg === "-n") newest = true;
		else if (arg === "-o") oldest = true;
		else if (arg === "-e") echo = true;
		else if (arg === "-l" || arg === "--list" || arg === "/?") continue;
		else if (taskkillMode && i === 0 && arg.toLowerCase() === "list") continue;
		else if (/^-[A-Z]+$/i.test(arg)) continue;
		else if (taskkillMode && arg.startsWith("/")) continue;
		else if (!taskkillMode && !pattern && /^\d+$/.test(arg)) targetPid = Number(arg);
		else if (!arg.startsWith("-")) pattern ??= arg;
	}
	if (!new Set(["TERM", "INT", "KILL", "HUP", "QUIT", "ABRT", "USR1", "USR2", "9", "15", "2", "1", "3", "6", "10", "12"]).has(signal)) {
		return { status: 2, stderr: `pkill: invalid signal '${signal}'\n` };
	}
	const legacyProcesses = Object.values(api.process.list());
	const manager = api.dusk?.processManager;
	const duskProcesses = manager?.activePids().map(pid => ({ pid, name: manager.getProcess(pid)?.argv?.[0] ?? "Dusk process", type: "dusk", argv: manager.getProcess(pid)?.argv })) ?? [];
	const processes = [...legacyProcesses, ...duskProcesses.filter(dusk => !legacyProcesses.some(legacy => legacy.pid === dusk.pid))];
	if (listMode) return { status: 0, stdout: `${processes.map(proc => `${proc.pid}\t${proc.name ?? "(unnamed)"}\t${proc.type ?? "process"}`).join("\n")}${processes.length ? "\n" : ""}` };
	if (taskkillMode && targetPid === undefined && !targetImage) return { status: 2, stderr: HELP };
	if (killMode && targetPid === undefined) return { status: 2, stderr: "Usage: kill [-signal] <pid>\n" };
	if (!taskkillMode && !killMode && targetPid === undefined && parentPid === undefined && !pattern) return { status: 2, stderr: HELP };
	let matches = processes.filter(proc => {
		if (proc.pid <= 1) return false;
		if (targetPid !== undefined) return proc.pid === targetPid;
		if (parentPid !== undefined) return manager?.getProcessRecord(proc.pid)?.ppid === parentPid;
		if (targetImage) return (proc.name ?? "").toLowerCase() === targetImage.toLowerCase();
		const value = full ? `${proc.name ?? ""} ${proc.wid ?? ""}` : (proc.name ?? "");
		return exact ? value.toLowerCase() === pattern?.toLowerCase() : value.toLowerCase().includes(pattern?.toLowerCase());
	});
	if (newest) matches = matches.sort((a, b) => b.pid - a.pid).slice(0, 1);
	if (oldest) matches = matches.sort((a, b) => a.pid - b.pid).slice(0, 1);
	if (!matches.length) return { status: taskkillMode ? 128 : 1, stderr: taskkillMode ? `ERROR: no running process matched ${targetPid ?? targetImage}.\n` : `pkill: no process matched '${parentPid ?? pattern}'.\n` };
	const errors: string[] = [];
	for (const proc of matches) {
		try {
			const duskProcess = manager?.getProcess(proc.pid);
			if (duskProcess && manager) manager._deliverSignal(proc.pid, `SIG${force ? "KILL" : signal}`);
			else api.process.kill(proc.pid);
		} catch (error) {
			errors.push(`${proc.pid}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	if (errors.length) return { status: 1, stderr: `${errors.join("\n")}\n` };
	return { status: 0, stdout: echo ? `${matches.map(proc => `${proc.name ?? "process"} (PID ${proc.pid})`).join("\n")}\n` : "" };
};

export const pkill: HostBinary = context => run(context);
export const killBinary: HostBinary = context => run(context, true);
export const taskkill: HostBinary = context => run(context, false);

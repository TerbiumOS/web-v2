import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

const VERSION = "2.0.0";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const LOGO = [
    "",
	"@@@@@@@@@@@@@@~ B@@@@@@@@#G?.",
	"B###&@@@@&####^ #@@@&PPPB@@@G.",
	" .. ~@@@@J ..  .#@@@P   ~&@@@^",
	"    ^@@@@?     .#@@@@###&@@&7",
	"    ^@@@@?     .#@@@#555P&@@B7",
	"    ^@@@@?     .#@@@P    G@@@@",
	"    ^@@@@?     .#@@@&GGG#@@@@Y",
	"    ^&@@@?      B@@@@@@@@&B5~",
];

const getNumber = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

const formatBytes = (value: number | null): string => {
	if (value === null || value < 0) return "Unknown";
	if (value < 1024) return `${Math.round(value)} B`;
	const units = ["KiB", "MiB", "GiB", "TiB"];
	let amount = value;
	let unit = "B";
	for (const next of units) {
		amount /= 1024;
		unit = next;
		if (amount < 1024) break;
	}
	return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${unit}`;
};

const formatUptime = (seconds: number): string => {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (days > 0) return `${days}d ${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
};

const readGpu = (): string => {
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (!gl) return "Unavailable";
		const info = gl.getExtension("WEBGL_debug_renderer_info");
		if (!info) return "Unavailable";
		const renderer = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
		if (typeof renderer !== "string" || renderer.length === 0) return "Unavailable";
		const angle = /^ANGLE \(.+?,\s*(.+?) \(/.exec(renderer);
		return angle?.[1] ?? renderer;
	} catch {
		return "Unavailable";
	}
};

const readStorage = async (): Promise<string> => {
	try {
		const estimate = await navigator.storage?.estimate();
		const used = getNumber(estimate?.usage);
		const quota = getNumber(estimate?.quota);
		if (used === null || quota === null || quota <= 0) return "Unavailable";
		return `${formatBytes(used)} / ${formatBytes(quota)} (${Math.round((used / quota) * 100)}%)`;
	} catch {
		return "Unavailable";
	}
};

const readMemory = (): string => {
	const memory = getNumber((navigator as Navigator & { deviceMemory?: number }).deviceMemory);
	return memory === null ? "Unavailable" : `${memory} GiB available`;
};

const readCpu = (): string => {
	const cores = getNumber(navigator.hardwareConcurrency);
	return cores === null ? "Unavailable" : `${cores} logical cores`;
};

const label = (name: string, value: string): string => `${BOLD}${CYAN}${name.padEnd(10)}${RESET} ${value}`;

const visibleLength = (value: string): number => value.replaceAll(/\x1b\[[0-9;]*m/g, "").length;

const usage = (): string => [
	`${BOLD}sysfetch${RESET} ${VERSION}`,
	"Usage: sysfetch [options]",
	"",
	"  -v, --version  Show version",
	"  -m, --minimal  Print facts without logo",
	"  --no-color     Disable ANSI colors",
	"  -h, --help     Show this help",
].join("\n") + "\n";

const run = async ({ args, env }: HostBinaryContext): Promise<HostBinaryResult> => {
	if (args.includes("-h") || args.includes("--help")) return { status: 0, stdout: usage() };
	if (args.includes("-v") || args.includes("--version")) return { status: 0, stdout: `sysfetch ${VERSION}\n` };

	const plain = args.includes("--no-color");
	const color = (value: string): string => plain ? value.replaceAll(/\x1b\[[0-9;]*m/g, "") : value;
	const user = env.USER ?? "user";
	const host = env.HOSTNAME ?? "duskjs";
	const version = env.TERBIUM_VERSION ?? "unknown";
	const shell = env.SHELL ?? "/bin/dsh";
	const uptime = formatUptime(Math.floor(performance.now() / 1000));
	const accent = plain ? "" : GREEN;
	const reset = plain ? "" : RESET;
	const logo = LOGO.map(line => `${accent}${line}${reset}`);
	const logoWidth = Math.max(...LOGO.map(line => line.length));
	const info = [
		`${BOLD}${user}@${host}${RESET}`,
		`${DIM}${"-".repeat(Math.max(12, user.length + host.length + 1))}${RESET}`,
		label("OS", `TerbiumOS ${version}`),
		label("Kernel", "Ayla / DuskJS"),
		label("Shell", shell),
		label("Uptime", uptime),
		label("CPU", readCpu()),
		label("Memory", readMemory()),
		label("GPU", readGpu()),
		label("Storage", await readStorage()),
	];
	const rows = Math.max(logo.length, info.length);
	const output = Array.from({ length: rows }, (_, index) => {
		const logoLine = logo[index] ?? "";
		const padding = " ".repeat(Math.max(3, logoWidth - visibleLength(logoLine) + 3));
		return `${logoLine}${padding}${info[index] ?? ""}`.trimEnd();
	}).join("\n");
	return { status: 0, stdout: `${color(output)}\n` };
};

export const sysfetch: HostBinary = run;
export default sysfetch;

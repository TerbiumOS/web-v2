import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

const HELP = "Usage: ping [-c count] [-i interval] [-W timeout] <host>\n       ping --http [-c count] [-i interval] <url>  HTTP connectivity probe\n";

const run: HostBinary = async ({ args }: HostBinaryContext): Promise<HostBinaryResult> => {
	if (args.includes("-h") || args.includes("--help")) return { status: 0, stdout: HELP };
	if (!args.includes("--http")) {
		return {
			status: 2,
			stderr: "ping: ICMP echo is unavailable in the browser network sandbox. Use `ping --http <url>` for an HTTP connectivity probe.\n",
		};
	}
	let count = 4;
	let interval = 1000;
	let timeout = 5000;
	const positional: string[] = [];
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (!arg) continue;
		const option = arg === "-c" || arg === "-n" ? "count" : arg === "-i" ? "interval" : arg === "-W" ? "timeout" : null;
		if (option) {
			const value = Number(args[++index]);
			if (!Number.isFinite(value) || value <= 0) return { status: 2, stderr: `ping: invalid ${option}\n${HELP}` };
			if (option === "count") count = Math.min(100, Math.floor(value));
			if (option === "interval") interval = Math.min(60_000, value * 1000);
			if (option === "timeout") timeout = Math.min(60_000, value * 1000);
		} else if (arg !== "--http") {
			if (arg.startsWith("-")) return { status: 2, stderr: `ping: unsupported option ${arg}\n${HELP}` };
			positional.push(arg);
		}
	}
	if (positional.length !== 1) return { status: 2, stderr: HELP };
	const host = positional[0];
	if (!host) return { status: 2, stderr: HELP };
	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(host) ? host : `https://${host}`);
		if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error(`unsupported protocol ${url.protocol}`);
	} catch (error) {
		return { status: 2, stderr: `ping: ${error instanceof Error ? error.message : String(error)}\n` };
	}
	if (!window.tb) return { status: 1, stderr: "ping: network API unavailable\n" };
	const lines = [`HTTP probe to ${url.href}:`];
	let received = 0;
	let total = 0;
	let minimum = Number.POSITIVE_INFINITY;
	let maximum = 0;
	for (let seq = 1; seq <= count; seq++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);
		const started = performance.now();
		try {
			const response = await window.tb.libcurl.fetch(url.href, { method: "HEAD", cache: "no-store", signal: controller.signal });
			const elapsed = performance.now() - started;
			received++;
			total += elapsed;
			minimum = Math.min(minimum, elapsed);
			maximum = Math.max(maximum, elapsed);
			lines.push(`probe=${seq} time=${elapsed.toFixed(2)} ms HTTP ${response.status}`);
		} catch (error) {
			lines.push(`probe=${seq} ${controller.signal.aborted ? "Request timed out" : error instanceof Error ? error.message : String(error)}`);
		} finally {
			clearTimeout(timer);
		}
		if (seq < count) await new Promise(resolve => setTimeout(resolve, interval));
	}
	lines.push(`\n${count} probes sent, ${received} successful, ${(((count - received) / count) * 100).toFixed(1)}% failed`);
	if (received) lines.push(`round-trip min/avg/max = ${minimum.toFixed(2)}/${(total / received).toFixed(2)}/${maximum.toFixed(2)} ms`);
	return { status: received ? 0 : 1, stdout: `${lines.join("\n")}\n` };
};

export const ping: HostBinary = run;
export default ping;

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import config from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { version } from "./package.json";
import { Mrrowisp } from "mrrowisp";

export function TServer() {
	config.config();
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	console.log("Starting Terbium...");
	const app = new Hono();

	const port = Number.parseInt(process.env.PORT || "8080", 10);
	const wispPort = Number.parseInt(process.env.WISP_PORT || "6001", 10);
	const reputation = process.env.REPUTATION_STORE || undefined;

	app.use(
		"*",
		cors({
			origin: `http://localhost:${port}`,
			allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
			credentials: true,
		}),
	);

	const activationEnabled = process.env.VITE_ACTIVATION_ENABLED && process.env.VITE_ACTIVATION_ENABLED.toLowerCase() === "true";
	if (activationEnabled) {
		console.log("MASQR-v2 Activation is Enabled");
		console.log(`License Server: ${process.env.LICENSE_SERVER_URL || "Not configured"}`);
	} else {
		console.log("MASQR-v2 Activation is Disabled");
	}

	app.use(
		"*",
		serveStatic({
			root: path.join(__dirname, "dist"),
		}),
	);

	const wisp = new Mrrowisp({
		port: wispPort,
		allowTCP: true,
		allowUDP: true,
		allowDirectIP: false,
		allowPrivateIPs: false,
		allowLoopbackIPs: false,
		enableV2: true,
		enableTwisp: false,
		tcpNoDelay: true,
		tcpBufferSize: 65535,
		bufferRemainingLength: 1 << 20,
		websocketPermessageDeflate: false,
		dnsServers: ["1.1.1.3", "1.0.0.3"],
		dnsMethod: "resolve",
		dnsResultOrder: "ipv4first",
		parseRealIP: true,
		trustedProxies: ["127.0.0.1", "::1"],
		trustedHeaders: ["CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"],
		maxMessageSize: 4 * 1024 * 1024,
		logLevel: "info",
		bandwidthLimitKbps: 200 * 1024,
		connectionsLimitPerIP: 600,
		connectionWindowSeconds: 10,
		floodProtection: {
			enabled: true,
			maxConnectsPerSourceIPPerSecond: 200,
			maxConnectsPerDestPerSecond: 32,
			maxConnectsPerDestPerMinute: 600,
			maxInFlightSyns: 4096,
			maxConcurrentStreamsPerConnection: 512,
			maxConcurrentConnections: 8192,
			synFloodSignature: {
				enabled: true,
				windowMs: 2000,
				minSamples: 64,
				failedHandshakeRatio: 0.8,
			},
			wsCloseAfterViolations: 24,
			logBlockedDials: false,
		},
		reputation: {
			enabled: reputation ? true : false,
			storePath: reputation,
			saveIntervalSeconds: 60,
			scoreDecayPerHour: 2,
			evictAfterDays: 14,
			thresholds: {
				warn: 30,
				throttle: 70,
				strict: 110,
			},
			weights: {
				privateEgress: 25,
				synSignature: 30,
				twispNoAuth: 50,
				burstRate: 4,
				successfulStream: -3,
				requestKnownBadDest: 4,
			},
			destinationWeights: {
				privateEgress: 25,
				synSignature: 35,
				distinctSourcesEscalation: 1,
			},
		},
		staticDir: "",
		blacklist: { hostnames: [], ports: [] },
		whitelist: { hostnames: [], ports: [] },
	});

	wisp.start(2);

	const server = createServer(nodeHandler);

	server.on("upgrade", (req: IncomingMessage, socket: any, head: Buffer) => {
		if (req.url?.endsWith("/wisp/")) {
			wisp.route(req as any, socket as any, head as any);
		} else {
			socket.destroy();
		}
	});

	server.listen(port, () => {
		console.log(`
  \x1b[38;2;50;174;98m@@@@@@@@@@@@@@~ B@@@@@@@@#G?.
  \x1b[38;2;50;174;98mB###&@@@@&####^ #@@@&PPPB@@@G.
  \x1b[38;2;50;174;98m .. ~@@@@J ..  .#@@@P   ~&@@@^      \x1b[38;2;60;195;240mWelcome to Terbium React v${version}
      \x1b[38;2;50;174;98m^@@@@?     .#@@@@###&@@&7
      \x1b[38;2;50;174;98m^@@@@?     .#@@@#555P&@@B7      \x1b[38;2;182;182;182mTerbium is running on ${port}
      \x1b[38;2;50;174;98m^@@@@?     .#@@@P    G@@@@      \x1b[38;2;182;182;182mAny problems you encounter let us know!
      \x1b[38;2;50;174;98m^@@@@?     .#@@@&GGG#@@@@Y
      \x1b[38;2;50;174;98m^&@@@?      B@@@@@@@@&B5~
    `);
	});
	async function nodeHandler(req: IncomingMessage, res: ServerResponse) {
		const proto = (req.socket as any).encrypted ? "https" : "http";
		const host = req.headers.host || "localhost";
		const url = new URL(req.url || "/", `${proto}://${host}`);
		const request = new Request(url.toString(), {
			method: req.method,
			headers: req.headers as any,
			body: req.method === "GET" || req.method === "HEAD" ? undefined : (req as any),
			duplex: "half",
		} as any);

		try {
			const response = await app.fetch(request);
			res.statusCode = response.status;
			response.headers.forEach((val, key) => {
				if (key.toLowerCase() === "set-cookie") {
					const prev = res.getHeader("set-cookie");
					if (prev) {
						const arr = Array.isArray(prev) ? prev.concat(val) : [String(prev), val];
						res.setHeader("set-cookie", arr);
					} else {
						res.setHeader("set-cookie", val);
					}
				} else {
					res.setHeader(key, val);
				}
			});
			if (response.body) {
				const reader = response.body.getReader();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) res.write(Buffer.from(value));
				}
			}
			res.end();
		} catch (err) {
			console.error(err);
			res.statusCode = 500;
			res.end("Internal Server Error");
		}
	}

	process.on("SIGINT", () => {
		console.log("\x1b[0m");
		wisp.stop();
		process.exit();
	});
}

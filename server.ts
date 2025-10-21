import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import config from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error no types
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

export function TServer() {
	config.config();
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	console.log("Starting Terbium...");
	const app = new Hono();

	const port = Number.parseInt(process.env.PORT || "8080", 10);

	app.use(
		"*",
		cors({
			origin: `http://localhost:${port}`,
			allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
			credentials: true,
		}),
	);

	const masqrCheck = process.env.MASQR && process.env.MASQR.toLowerCase() === "true";
	if (masqrCheck) {
		console.log("Masqr is Enabled");
	} else {
		console.log("Masqr is Disabled");
	}

	async function MasqFail(c: any) {
		const host = c.req.header("host");
		if (!host) {
			return c.html(fs.readFileSync("fail.html", "utf8"));
		}
		const safeHost = host.split(":")[0].replace(/[^a-zA-Z0-9-_\.]/g, "");
		const safeFilename = path.basename(`${safeHost}.html`);
		const safeJoin = path.join(process.cwd(), "Masqrd", safeFilename);
		try {
			await fs.promises.access(safeJoin);
			const failureFileLocal = await fs.promises.readFile(safeJoin, "utf8");
			return c.html(failureFileLocal);
		} catch {
			return c.html(fs.readFileSync("fail.html", "utf8"));
		}
	}

	if (masqrCheck) {
		const whitelisted = (process.env.WHITELISTED_DOMAINS || "")
			.split(",")
			.map(s => s.trim())
			.filter(Boolean);

		app.use("*", async (c, next) => {
			const host = c.req.header("host") ?? "";
			if (host && whitelisted.includes(host)) {
				await next();
				return;
			}
			if (c.req.url.includes("/bare")) {
				await next();
				return;
			}
			if (getCookie(c, "authcheck")) {
				await next();
				return;
			}
			if (getCookie(c, "refreshcheck") !== "true") {
				setCookie(c, "refreshcheck", "true", { maxAge: 10000 });
				return await MasqFail(c);
			}
			const authheader = c.req.header("authorization");
			if (!authheader) {
				c.header("WWW-Authenticate", "Basic");
				c.status(401);
				return await MasqFail(c);
			}
			const token = authheader.split(" ")[1] ?? "";
			let user = "";
			let pass = "";
			try {
				const decoded = Buffer.from(token, "base64").toString();
				[user, pass] = decoded.split(":");
			} catch {
				return await MasqFail(c);
			}
			const licenseResp = await fetch(`${process.env.LICENSE_SERVER_URL}${encodeURIComponent(pass)}&host=${encodeURIComponent(host)}`);
			const licenseCheck = (await licenseResp.json())?.status;
			console.log(`\x1b[0m${process.env.LICENSE_SERVER_URL}${pass}&host=${host} returned: ${licenseCheck}`);
			if (licenseCheck === "License valid") {
				setCookie(c, "authcheck", "true", {
					expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				});
				return c.redirect("/");
			}
			return await MasqFail(c);
		});
	}

	app.use(
		"*",
		serveStatic({
			root: path.join(__dirname, "dist"),
		}),
	);
	wisp.options.dns_method = "resolve";
	wisp.options.dns_servers = ["1.1.1.3", "1.0.0.3"];
	wisp.options.dns_result_order = "ipv4first";
	const server = createServer(nodeHandler);

	server.on("upgrade", (req: IncomingMessage, socket: any, head: Buffer) => {
		if (req.url?.endsWith("/wisp/")) {
			wisp.routeRequest(req as any, socket as any, head as any);
		} else {
			socket.destroy();
		}
	});

	const manifest = fs.readFileSync(path.join(__dirname, "package.json"), "utf-8");
	const { version } = JSON.parse(manifest);
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
		});

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
		process.exit();
	});
}

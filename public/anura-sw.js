/* global workbox */

// was a workaround for a firefox quirk where crossOriginIsolated
// is not reported properly in a service worker, now its just assumed for
// compatibility with UV
Object.defineProperty(globalThis, "crossOriginIsolated", {
	value: true,
	writable: false,
});

// Not recommended but a bypass for libs that expect window to exist
self.window = self;

// Due to anura's filesystem only being available once an anura instance is running,
// we need a temporary filesystem to store files that are requested for caching.
// As the anura filesystem is a wrapper around Filer, we can use default Filer here.
importScripts("/assets/libs/filer.min.js");
importScripts("/tfs/tfs.js");

self.tfs.initSw();

// Importing mime
importScripts("/assets/libs/mime.iife.js");

// self.fs = new Filer.FileSystem({
//     name: "anura-mainContext",
//     provider: new Filer.FileSystem.providers.IndexedDB(),
// });

const filerfs = new Filer.FileSystem({
	name: "anura-mainContext",
	provider: new Filer.FileSystem.providers.IndexedDB(),
});
const filersh = new filerfs.Shell();

setTimeout(() => {
	self.opfs = window.tfs.fs;
	self.opfssh = window.tfs.shell;
}, 10);

async function currentFs() {
	// isConnected will return true if the anura instance is running, and otherwise infinitely wait.
	// it will never return false, but it may hang indefinitely if the anura instance is not running.
	// here, we race the isConnected promise with a timeout to prevent hanging indefinitely.

	if (!self.isConnected) {
		// An anura instance has not been started yet to populate the isConnected promise.
		// We automatically know that the filesystem is not connected.
		return {
			fs: self.opfs || filerfs,
			sh: self.opfssh || filersh,
		};
	}

	const CONN_TIMEOUT = 1000;
	const winner = await Promise.race([
		new Promise(resolve =>
			setTimeout(() => {
				resolve({
					fs: self.opfs || filerfs,
					sh: self.opfssh || filersh,
					fallback: true,
				});
			}, CONN_TIMEOUT),
		),
		self.isConnected.then(() => ({
			fs: self.anurafs,
			sh: self.anurash,
		})),
	]);

	if (winner.fallback) {
		console.debug("Falling back to Filer");
		// unset isConnected so that we don't hold up future requests
		self.isConnected = undefined;
	}

	return winner;
}

self.Buffer = Filer.Buffer;

importScripts("/assets/libs/comlink.min.umd.js");
importScripts("/assets/libs/idb-keyval.js");
importScripts("/assets/libs/workbox/workbox-sw.js");
workbox.setConfig({
	debug: false,
	modulePathPrefix: "/assets/libs/workbox/",
});

const supportedWebDAVMethods = [
	"OPTIONS",
	"PROPFIND",
	"PROPPATCH",
	"MKCOL",
	"GET",
	"HEAD",
	"POST", // sometimes used for special operations
	"PUT",
	"DELETE",
	"COPY",
	"MOVE",
	"LOCK",
	"UNLOCK",
];

async function handleDavRequest({ request, url }) {
	const fsCallback = (await currentFs()).fs;
	const fs = fsCallback.promises;
	const shell = await new fsCallback.Shell();
	const method = request.method;
	const path = decodeURIComponent(url.pathname.replace(/^\/dav/, "") || "/");

	const getBuffer = async () => new Uint8Array(await request.arrayBuffer());
	const getDestPath = () => decodeURIComponent(new URL(request.headers.get("Destination"), url).pathname.replace(/^\/dav/, ""));

	try {
		switch (method) {
			case "OPTIONS":
				return new Response(null, {
					status: 204,
					headers: {
						Allow: "OPTIONS, PROPFIND, PROPPATCH, MKCOL, GET, HEAD, POST, PUT, DELETE, COPY, MOVE, LOCK, UNLOCK",
						DAV: "1, 2",
					},
				});

			case "PROPFIND": {
				try {
					const stats = await fs.stat(path);
					const isDirectory = stats.type === "DIRECTORY";
					const href = url.pathname;
					let responses = "";

					const renderEntry = async (entryPath, stat) => {
						const isDir = stat.type === "DIRECTORY";
						const contentLength = isDir ? "" : `<a:getcontentlength b:dt="int">${stat.size}</a:getcontentlength>`;
						const contentType = isDir ? "" : `<a:getcontenttype>${mime.default.getType(entryPath) || "application/octet-stream"}</a:getcontenttype>`;
						const creationDate = new Date(stat.ctime).toISOString();
						const lastModified = new Date(stat.mtime).toUTCString();
						const resourcetype = isDir ? "<a:collection/>" : "";

						return `
							<a:response>
								<a:href>${entryPath}</a:href>
								<a:propstat>
									<a:status>HTTP/1.1 200 OK</a:status>
									<a:prop>
										<a:resourcetype>${resourcetype}</a:resourcetype>
										${contentLength}
										${contentType}
										<a:creationdate>${creationDate}</a:creationdate>
										<a:getlastmodified>${lastModified}</a:getlastmodified>
									</a:prop>
								</a:propstat>
							</a:response>
						`;
					};

					if (isDirectory) {
						responses = await renderEntry(href.endsWith("/") ? href : href + "/", stats);

						const files = await fs.readdir(path);
						const fileResponses = await Promise.all(
							files.map(async file => {
								const fullPath = path.endsWith("/") ? path + file : `${path}/${file}`;
								const stat = await fs.stat(fullPath);
								const entryHref = `${href.endsWith("/") ? href : href + "/"}${file}`;
								return renderEntry(entryHref, stat);
							}),
						);
						responses += fileResponses.join("");
					} else {
						responses = await renderEntry(href, stats);
					}

					const xml = `
						<?xml version="1.0"?>
						<a:multistatus xmlns:a="DAV:" xmlns:b="urn:uuid:c2f41010-65b3-11d1-a29f-00aa00c14882/">
							${responses}
						</a:multistatus>
					`.trim();

					return new Response(xml, {
						headers: { "Content-Type": "application/xml" },
						status: 207,
					});
				} catch (err) {
					console.error(path, err);
					const xml = `
					<?xml version="1.0"?>
					<a:multistatus xmlns:a="DAV:">
						<a:response>
							<a:href>${url.pathname}</a:href>
							<a:status>HTTP/1.1 404 Not Found</a:status>
						</a:response>
					</a:multistatus>
				`.trim();

					return new Response(xml, {
						headers: { "Content-Type": "application/xml" },
						status: 207, // multi-status
					});
				}
			}

			case "PROPPATCH":
				return new Response(null, { status: 207 }); // No-op

			case "MKCOL":
				try {
					await fs.mkdir(path);
					return new Response(null, { status: 201 });
				} catch {
					return new Response(null, { status: 405 });
				}

			case "GET":
			case "HEAD": {
				try {
					const data = await fs.readFile(path);
					return new Response(method === "HEAD" ? null : new Blob([data]), {
						headers: {
							"Content-Type": mime.default.getType(path) || "application/octet-stream",
						},
						status: 200,
					});
				} catch {
					return new Response(null, { status: 404 });
				}
			}

			case "PUT": {
				const buffer = await getBuffer();
				try {
					console.log(buffer);
					await fs.writeFile(path, Filer.Buffer.from(buffer));
					return new Response(null, { status: 201 });
				} catch {
					return new Response(null, { status: 500 });
				}
			}

			case "DELETE":
				try {
					await shell.promises.rm(path, { recursive: true });
					return new Response(null, { status: 204 });
				} catch {
					return new Response(null, { status: 404 });
				}

			case "COPY": {
				// This is technically invalid -- Copy should handle full folders as well but filer doesn't have a convinient way to do this :/
				// take this broken solution in the interim - Rafflesia

				const dest = getDestPath();
				try {
					await shell.promises.cpr(path, dest);
					return new Response(null, { status: 201 });
				} catch (e) {
					console.error(e);
					return new Response(null, { status: 404 });
				}
			}

			case "MOVE": {
				const dest = getDestPath();
				try {
					await fs.rename(path, dest);
					return new Response(null, { status: 201 });
				} catch {
					return new Response(null, { status: 500 });
				}
			}

			case "LOCK":
			case "UNLOCK": {
				return new Response(`<?xml version="1.0"?><d:prop xmlns:d="DAV:"><d:lockdiscovery/></d:prop>`, {
					status: 200,
					headers: {
						"Content-Type": "application/xml",
						"Lock-Token": `<opaquelocktoken:fake-lock-${Date.now()}>`,
					},
				});
			}

			case "POST":
				return new Response("POST not implemented", { status: 204 });

			default:
				return new Response("Unsupported WebDAV method", {
					status: 405,
				});
		}
	} catch (err) {
		return new Response(`Internal error: ${err.message}`, { status: 500 });
	}
}

for (const method of supportedWebDAVMethods) {
	workbox.routing.registerRoute(
		/\/dav/,
		async event => {
			return await handleDavRequest(event);
		},
		method,
	);
}

workbox.core.skipWaiting();
workbox.core.clientsClaim();

var cacheenabled = false;

const callbacks = {};
const filepickerCallbacks = {};

addEventListener("message", event => {
	if (event.data.anura_target === "anura.x86.proxy") {
		const callback = callbacks[event.data.id];
		callback(event.data.value);
	}
	if (event.data.anura_target === "anura.cache") {
		cacheenabled = event.data.value;
		idbKeyval.set("cacheenabled", event.data.value);
	}
	if (event.data.anura_target === "anura.filepicker.result") {
		const callback = filepickerCallbacks[event.data.id];
		callback(event.data.value);
	}
	if (event.data.anura_target === "anura.comlink.init") {
		self.swShared = Comlink.wrap(event.data.value);
		swShared.test.then(console.log);
		self.isConnected = swShared.test;
	}
	if (event.data.anura_target === "anura.nohost.set") {
		self.anurafs = swShared.anura.fs;
		self.anurash = swShared.sh;
	}
});

workbox.routing.registerRoute(/\/extension\//, async ({ url }) => {
	const { fs } = await currentFs();
	console.debug("Caught a aboutbrowser extension request");
	try {
		return new Response(await fs.promises.readFile(url.pathname));
	} catch (e) {
		return new Response("File not found bruh", { status: 404 });
	}
});

workbox.routing.registerRoute(
	/\/showFilePicker/,
	async ({ url }) => {
		const id = crypto.randomUUID();
		const clients = (await self.clients.matchAll()).filter(v => new URL(v.url).pathname === "/");
		if (clients.length < 1) return new Response("no clients were available to take your request");
		const client = clients[0];

		const regex = url.searchParams.get("regex") || ".*";
		const type = url.searchParams.get("type") || "file";

		client.postMessage({
			anura_target: "anura.filepicker",
			regex,
			id,
			type,
		});

		const resp = await new Promise(resolve => {
			filepickerCallbacks[id] = resolve;
		});

		return new Response(JSON.stringify(resp), {
			status: resp.cancelled ? 444 : 200,
		});
	},
	"GET",
);

async function serveFile(path, fsOverride, shOverride) {
	let fs;
	let sh;

	if (fsOverride && shOverride) {
		fs = fsOverride;
		sh = shOverride;
	} else {
		const { fs: fs_, sh: sh_ } = await currentFs();
		fs = fsOverride || fs_;
		sh = shOverride || sh_;
	}

	if (!fs) {
		// HOPEFULLY this will never happen,
		// as the filesystem should always have a backup
		return new Response(
			JSON.stringify({
				error: "No filesystem available.",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsheaders,
				},
			},
		);
	}

	try {
		const stats = await fs.promises.stat(path);
		if (stats.type === "DIRECTORY") {
			// Can't do withFileTypes because it is unserializable
			const entries = await Promise.all((await fs.promises.readdir(path)).map(async e => await fs.promises.stat(`${path}/${e}`)));
			function page() {
				return `<!DOCTYPE html>
					<html>
						<head>
							<link rel="stylesheet" href="/assets/fs.ui/fs.css">
						</head>
						<body>
							<div class="flex flex-col pt-6 gap-2.5 px-4">
								<div class="flex items-center gap-2 w-max leading-none font-bold text-2xl light:text-[#000000de]">
									<h1>Index of</h1>
									<div class="breadcrumbs flex gap-1"></div>
								</div>
								<div>
									<div class="flex items-center gap-2">
										<svg class="nav-back size-8 dark:text-[#ffffff88] text-[#00000088] duration-150 ${path !== "/" ? "dark:hover:text-[#ffffffde] hover:text-[#000000] cursor-(--cursor-pointer)" : "cursor-(--cursor-normal)"}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-4.28 9.22a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06l-1.72-1.72h5.69a.75.75 0 0 0 0-1.5h-5.69l1.72-1.72a.75.75 0 0 0-1.06-1.06l-3 3Z" clip-rule="evenodd" />
										</svg>
										<svg class="nav-home size-8 dark:text-[#ffffff88] text-[#00000088] duration-150 ${path !== "/" ? "dark:hover:text-[#ffffffde] hover:text-[#000000] cursor-(--cursor-pointer)" : "cursor-(--cursor-normal)"}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
											<path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
										</svg>
									</div>
								</div>
								<table class="w-max">
									<thead>
										<tr class="border-b dark:border-[#ffffff38] border-[#00000068]">
											<th class="text-left p-1.5 pl-2.5">Name</th>
											<th class="text-left p-1.5">Type</th>
											<th class="text-left p-1.5">Size</th>
											<th class="text-left p-1.5">Last Modified</th>
										</tr>
									</thead>
									<tbody>
										${entries
											.map(
												entry => `
												<tr class="dark:hover:bg-[#ffffff15] hover:bg-[#00000020] duration-150 ease-in-out select-none cursor-(--cursor-pointer)" ondblclick="window.location.href='/fs${path}/${entry.name}'">
													<th class="flex text-left py-1.5 pl-2 pr-[100px] gap-2 select-none">
														${
															entry.type === "DIRECTORY"
																? `
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 dark:text-[#ffffff48] text-[#00000068]">
																	<path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
																</svg>
															`
																: `
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 dark:text-[#ffffff48] text-[#00000068]">
																	<path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clip-rule="evenodd" />
																	<path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
																</svg>
															`
														}
														${entry.name}
													</th>
													<td class="pl-2 pr-3.5 select-none">${entry.type}</td>
													<td class="pl-2 pr-3.5 select-none">${
														entry.type === "DIRECTORY"
															? "<span class='dark:text-[#ffffff50] text-[#00000070]'>-</span>"
															: entry.size > 1024 * 1024 * 1024
																? `${(entry.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
																: entry.size > 1024 * 1024
																	? `${(entry.size / (1024 * 1024)).toFixed(2)} MB`
																	: entry.size > 1024
																		? `${(entry.size / 1024).toFixed(2)} KB`
																		: `${entry.size} bytes`
													}</td>
													<td class="pl-2 pr-3.5 select-none">${new Date(entry.mtime).toLocaleString()}</td>
												</tr>
											`,
											)
											.join("")}
									</tbody>
								</table>
							</div>
							<script src="/assets/libs/tailwind.min.js"></script>
							<script src="/assets/fs.ui/fs.js"></script>
						</body>
					</html>
				`;
			}
			return new Response(page(), {
				headers: {
					"Content-Type": "text/html",
					...corsheaders,
				},
			});
			/* Custom Terbium way lol
			return new Response(JSON.stringify(entries), {
				headers: {
					"Content-Type": "application/json",
					...corsheaders,
				},
			});
			*/
		}
		const type = mime.default.getType(path) || "application/octet-stream";

		return new Response(await fs.promises.readFile(path, "arraybuffer"), {
			headers: {
				"Content-Type": type,
				"Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
				...corsheaders,
			},
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message, code: e.code, status: 404 }), {
			status: 404,
			headers: {
				"Content-Type": "application/json",
				...corsheaders,
			},
		});
	}
}

async function updateFile(path, data) {
	const { fs, sh } = await currentFs();
	switch (data.action) {
		case "write":
			await sh.promises.mkdirp(path.replace(/[^/]*$/g, ""));
			await fs.promises.writeFile(path, data.contents);
			return new Response(
				JSON.stringify({
					status: "ok",
				}),
				{
					headers: {
						"Content-Type": "application/json",
						...corsheaders,
					},
				},
			);
		case "delete":
			await sh.promises.rm(path, { recursive: true });
			return new Response(
				JSON.stringify({
					status: "ok",
				}),
				{
					headers: {
						"Content-Type": "application/json",
						...corsheaders,
					},
				},
			);
		case "touch":
			await sh.promises.touch(path);
			return new Response(
				JSON.stringify({
					status: "ok",
				}),
				{
					headers: {
						"Content-Type": "application/json",
						...corsheaders,
					},
				},
			);
		case "mkdir":
			await sh.promises.mkdirp(path);
			return new Response(
				JSON.stringify({
					status: "ok",
				}),
				{
					headers: {
						"Content-Type": "application/json",
						...corsheaders,
					},
				},
			);
	}
}

const fsRegex = /\/fs(\/.*)/;

const corsheaders = {
	"Cross-Origin-Embedder-Policy": "require-corp",
	"Access-Control-Allow-Origin": "*",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-site",
};

workbox.routing.registerRoute(
	fsRegex,
	async ({ url }) => {
		let path = url.pathname.match(fsRegex)[1];
		path = decodeURI(path);
		return serveFile(path);
	},
	"GET",
);

workbox.routing.registerRoute(
	fsRegex,
	async ({ url, request }) => {
		let path = url.pathname.match(fsRegex)[1];
		const action = request.headers.get("x-fs-action") || url.searchParams.get("action");
		if (!action) {
			return new Response(
				JSON.stringify({
					error: "No action specified",
					status: 400,
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
						...corsheaders,
					},
				},
			);
		}
		path = decodeURI(path);
		const body = await request.arrayBuffer();
		return updateFile(path, {
			action,
			contents: Buffer.from(body),
		});
	},
	"POST",
);

workbox.routing.registerRoute(/^(?!.*(\/config.json|\/MILESTONE|\/x86images\/|\/service\/))/, async ({ url }) => {
	if (cacheenabled === undefined) {
		console.debug("retrieving cache value");
		const result = await idbKeyval.get("cacheenabled");
		if (result !== undefined || result !== null) {
			cacheenabled = result;
		}
	}
	if ((!cacheenabled && url.pathname === "/" && !navigator.onLine) || (!cacheenabled && url.pathname === "/index.html" && !navigator.onLine)) {
		return new Response(offlineError(), {
			status: 500,
			headers: { "content-type": "text/html" },
		});
	}
	if (!cacheenabled) {
		const fetchResponse = await fetch(url);
		return new Response(await fetchResponse.arrayBuffer(), {
			headers: {
				...Object.fromEntries(fetchResponse.headers.entries()),
				...corsheaders,
			},
		});

		return fetchResponse;
	}
	if (url.pathname === "/") {
		url.pathname = "/index.html";
	}
	if (url.password) return new Response("<script>window.location.href = window.location.href</script>", { headers: { "content-type": "text/html" } });
	const basepath = "/anura_files";
	const path = decodeURI(url.pathname);

	// Force Filer to be used in cache routes, as it does not require waiting for anura to be connected
	const fs = self.opfs || filerfs;
	const sh = self.opfssh || filersh;

	// Terbium already has its own way for caching files to the file system so doing it again is just a waste of space
	/*
		const response = await serveFile(`${basepath}${path}`, fs, sh);

		if (response.ok) {
			return response;
		} else {
		*/
	try {
		const fetchResponse = await fetch(url);
		// Promise so that we can return the response before we cache it, for faster response times
		return new Promise(async resolve => {
			const corsResponse = new Response(await fetchResponse.clone().arrayBuffer(), {
				headers: {
					...Object.fromEntries(fetchResponse.headers.entries()),
					...corsheaders,
				},
			});

			resolve(corsResponse);

			/*
					if (fetchResponse.ok) {
						const buffer = await fetchResponse.clone().arrayBuffer();
						await sh.promises.mkdirp(
							`${basepath}${path.replace(/[^/]*$/g, "")}`,
						);
						// Explicitly use Filer's fs here, as
						// Buffers lose their inheritance when passed
						// to anura's fs, causing them to be treated as
						// strings
						await fs.promises.writeFile(
							`${basepath}${path}`,
							Buffer.from(buffer),
						);
					}*/
		}).catch(e => {
			console.error("I hate this bug: ", e);
		});
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: e.message,
				status: 500,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsheaders,
				},
			},
		);
	}
});

importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/uv/uv.sw.js");
importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
const uv = new UVServiceWorker();

const methods = ["GET", "POST", "HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"];

methods.forEach(method => {
	workbox.routing.registerRoute(
		/\/uv\/service\//,
		async event => {
			console.debug("Got UV req");
			uv.on("request", event => {
				event.data.headers["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Terbium-Browser/2.1.0";
			});
			return await uv.fetch(event);
		},
		method,
	);
});

// Route w-corp-staticblitz.com and subdomains through BareMux, so that the Node.js subsystem doesn't get blocked by filters
methods.forEach(method => {
	workbox.routing.registerRoute(
		({ url }) => {
			return url.hostname === "w-corp-staticblitz.com" || url.hostname.endsWith(".w-corp-staticblitz.com");
		},
		async event => {
			try {
				// Clone the request
				const bareRequest = new Request(event.url.href, {
					method: event.request.method,
					headers: event.request.headers,
					body: event.request.body,
					mode: event.request.mode,
					credentials: event.request.credentials,
					cache: event.request.cache,
					redirect: event.request.redirect,
					referrer: event.request.referrer,
					integrity: event.request.integrity,
				});

				return await bareClient.fetch(bareRequest);
			} catch (error) {
				console.error("BareMux *.w-corp-staticblitz.com proxy fetch failed", error);
				return new Response("Failed to fetch through BareMux", {
					status: 500,
				});
			}
		},
		method,
	);
});

scramjet.loadConfig();

methods.forEach(method => {
	workbox.routing.registerRoute(
		/\/service\//,
		async ({ event }) => {
			console.log("Got SJ req");
			await scramjet.loadConfig();
			if (scramjet.route(event)) {
				return scramjet.fetch(event);
			}
			return fetch(event.request);
		},
		method,
	);
});

// have to put this here because no cache
function offlineError() {
	return `<!DOCTYPE html>
            <html>
            <head>
            <style>
            body {
                font-family: "Roboto", RobotoDraft, "Droid Sans", Arial, Helvetica, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                text-align: center;
                background: black;
                color: white;
                overflow: none;
                margin: 0;
            }
            #wrapper {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100vh;
            }
            </style>
            </head>
            <body>
            <div id="wrapper">
            <h1>Offline Error</h1>
            <p>Try refreshing the page if you are connected to the internet</p>
            </div>
            </body>
            </html>
            `;
}

async function initSw() {
	for (const client of await self.clients.matchAll()) {
		client.postMessage({
			anura_target: "anura.sw.reinit",
		});
	}
}
initSw();

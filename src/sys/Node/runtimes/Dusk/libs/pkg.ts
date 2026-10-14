import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = Record<string, JsonValue>;

type Repository = {
	name?: string;
	url: string;
	type?: "terbium" | "anura" | "auto";
	enabled?: boolean;
};

type PackageRecord = JsonObject & {
	name: string;
	version?: string;
	description?: string;
	icon?: string;
	"pkg-download"?: string;
	"anura-pkg"?: string;
	package?: string;
	data?: string;
	requirements?: JsonObject;
};

type InstalledRecord = {
	name: string;
	user?: string;
	config: string;
	package?: string;
	version?: string;
	type?: "tapp" | "anura" | "web";
	repository?: string;
};

type RuntimeApi = {
	fs: {
		promises: {
			readFile(path: string, encoding?: string): Promise<unknown>;
			writeFile(path: string, data: unknown, encoding?: string): Promise<void>;
			mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
			unlink(path: string): Promise<void>;
			rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
			readdir(path: string): Promise<string[]>;
			exists(path: string): Promise<boolean>;
		};
	};
	libcurl: { fetch(url: string): Promise<Response> };
	launcher: { addApp(config: JsonObject): Promise<void>; removeApp(name: string): Promise<void> };
	user: { username(): Promise<string> };
	system: { version(): string | number | unknown };
	proxy: { get(): Promise<string> };
	buffer: { from(value: Uint8Array): unknown };
	fflate: { unzipSync(data: Uint8Array): Record<string, Uint8Array> };
};

const ROOT = "/apps";
const REPOS_PATH = `${ROOT}/pkg/repos.json`;
const CACHE_PATH = `${ROOT}/pkg/lists`;
const STATUS_PATH = `${ROOT}/pkg/status.json`;
const INSTALLED_PATH = `${ROOT}/installed.json`;
const DEFAULT_REPOSITORIES: Repository[] = [
	{ name: "TB App Repo", url: "https://raw.githubusercontent.com/TerbiumOS/tb-repo/refs/heads/main/manifest.json", type: "terbium" },
	{ name: "XSTARS XTRAS", url: "https://raw.githubusercontent.com/Notplayingallday383/app-repo/refs/heads/main/manifest.json", type: "terbium" },
	{ name: "Anura App Repo", url: "https://raw.githubusercontent.com/MercuryWorkshop/anura-repo/refs/heads/master/manifest.json", type: "anura" },
];

const HELP = `${[
	"TPKG 3.0.0 — Terbium package manager",
	"Usage: pkg <command> [package ...]",
	"",
	"Repository commands (apt-style)",
	"  update [repo]                 Refresh repository indexes",
	"  repo list                     Show configured repositories",
	"  repo add <url> [name]         Add a Terbium or Anura repository",
	"  repo remove <url|name>        Remove a repository",
	"  repo enable|disable <url>     Toggle a repository",
	"",
	"Package commands",
	"  search <term>                 Search cached repository indexes",
	"  show <package>                Show package metadata",
	"  install|add <package ...>     Install TAPP, Anura, or web app packages",
	"  remove|purge <package ...>    Remove installed packages",
	"  upgrade [package ...]         Upgrade installed packages",
	"  list [--upgradable]           List installed packages",
	"  clean                         Remove cached indexes and temporary files",
	"  help                          Show this help",
	"",
	"Examples: pkg update && pkg search browser && pkg install browser",
	"          pkg repo add https://example.com/manifest.json MyRepo",
].join("\n")}\n`;

const getApi = (): RuntimeApi => {
	const api = (globalThis as typeof globalThis & { window?: { tb?: RuntimeApi } }).window?.tb;
	if (!api) throw new Error("Terbium API is unavailable (pkg must run inside TerbiumOS)");
	return api;
};

const toBytes = (value: ArrayBuffer | Uint8Array): Uint8Array => (value instanceof Uint8Array ? value : new Uint8Array(value));
const safeName = (value: string): string =>
	value
		.trim()
		.replaceAll(/[^\p{L}\p{N}._ -]/gu, "_")
		.replaceAll(/\s+/g, " ");

const readJson = async <T>(api: RuntimeApi, path: string, fallback: T): Promise<T> => {
	try {
		const value = JSON.parse(String(await api.fs.promises.readFile(path, "utf8")));
		return value as T;
	} catch {
		return fallback;
	}
};

const ensureDir = async (api: RuntimeApi, path: string): Promise<void> => {
	await api.fs.promises.mkdir(path, { recursive: true });
};

const writeJson = async (api: RuntimeApi, path: string, value: unknown): Promise<void> => {
	await ensureDir(api, path.slice(0, path.lastIndexOf("/")) || "/");
	await api.fs.promises.writeFile(path, JSON.stringify(value, null, 2), "utf8");
};

const getRepositories = async (api: RuntimeApi): Promise<Repository[]> => {
	await ensureDir(api, `${ROOT}/pkg`);
	let repositories = await readJson<Repository[]>(api, REPOS_PATH, []);
	if (!Array.isArray(repositories) || repositories.length === 0) {
		try {
			const user = await api.user.username();
			const legacy = await readJson<Repository[]>(api, `/apps/user/${user}/app store/repos.json`, []);
			if (Array.isArray(legacy) && legacy.length) repositories = legacy.map(normalizeRepository).filter(isRepository);
		} catch {
			/* Initialize the established repositories below. */
		}
	}
	if (!repositories.length) repositories = [...DEFAULT_REPOSITORIES];
	await writeJson(api, REPOS_PATH, repositories);
	return repositories;
};

const normalizeRepository = (value: unknown): Repository | null => {
	if (typeof value === "string") return value.trim() ? { url: value.trim(), type: "auto" } : null;
	if (!value || typeof value !== "object") return null;
	const raw = value as Partial<Repository>;
	if (typeof raw.url !== "string" || !raw.url.trim()) return null;
	return { ...raw, url: raw.url.trim(), type: raw.type ?? "auto" };
};

const isRepository = (value: Repository | null): value is Repository => value !== null;

const getInstalled = async (api: RuntimeApi): Promise<InstalledRecord[]> => {
	const records = await readJson<unknown>(api, INSTALLED_PATH, []);
	return Array.isArray(records) ? records.filter((record): record is InstalledRecord => !!record && typeof record === "object" && typeof (record as InstalledRecord).name === "string" && typeof (record as InstalledRecord).config === "string") : [];
};

const setInstalled = async (api: RuntimeApi, records: InstalledRecord[]): Promise<void> => writeJson(api, INSTALLED_PATH, records);

const fetchJson = async (api: RuntimeApi, url: string): Promise<JsonObject> => {
	const response = await api.libcurl.fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText || ""} fetching ${url}`.trim());
	return (await response.json()) as JsonObject;
};

const repositoryType = (repo: Repository, manifest: JsonObject): "terbium" | "anura" => {
	if (repo.type === "terbium" || repo.type === "anura") return repo.type;
	return "repo" in manifest || "apps" in manifest ? "terbium" : "anura";
};

const entriesFromManifest = (manifest: JsonObject): PackageRecord[] => {
	const entries = manifest.apps ?? manifest.packages ?? manifest;
	if (Array.isArray(entries)) return entries.filter((entry): entry is PackageRecord => !!entry && typeof entry === "object" && typeof entry.name === "string");
	if (entries && typeof entries === "object") {
		return Object.entries(entries as JsonObject).flatMap(([name, entry]) => (entry && typeof entry === "object" ? [{ name, ...(entry as JsonObject) }] : []));
	}
	return [];
};

const indexPath = (index: number): string => `${CACHE_PATH}/${index}.json`;

const refresh = async (api: RuntimeApi, selected?: string): Promise<HostBinaryResult> => {
	const repositories = await getRepositories(api);
	await ensureDir(api, CACHE_PATH);
	const output: string[] = [];
	let failed = 0;
	for (const [index, repo] of repositories.entries()) {
		if (repo.enabled === false) continue;
		if (selected && repo.url !== selected && repo.name?.toLowerCase() !== selected.toLowerCase()) continue;
		try {
			const manifest = await fetchJson(api, repo.url);
			const type = repositoryType(repo, manifest);
			const packages = entriesFromManifest(manifest);
			await writeJson(api, indexPath(index), { refreshed: new Date().toISOString(), repository: repo, type, packages });
			output.push(`Hit: ${repo.name ?? repo.url} — ${packages.length} packages`);
		} catch (error) {
			failed++;
			output.push(`Err: ${repo.name ?? repo.url} — ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	if (selected && !repositories.some(repo => repo.url === selected || repo.name?.toLowerCase() === selected.toLowerCase())) {
		return { status: 1, stderr: `pkg: repository not found: ${selected}\n` };
	}
	return { status: failed ? 1 : 0, stdout: `${output.join("\n")}\n${failed ? `\n${failed} repository index(es) failed to update.\n` : "\nPackage lists updated.\n"}` };
};

type IndexedPackage = { pkg: PackageRecord; repo: Repository; type: "terbium" | "anura" };

const allPackages = async (api: RuntimeApi): Promise<IndexedPackage[]> => {
	const repositories = await getRepositories(api);
	const indexed: IndexedPackage[] = [];
	for (const [index, repo] of repositories.entries()) {
		if (repo.enabled === false) continue;
		const cache = await readJson<JsonObject | null>(api, indexPath(index), null);
		if (!cache || !Array.isArray(cache.packages)) continue;
		for (const pkg of cache.packages as PackageRecord[]) {
			const type = cache.type === "anura" || cache.repository?.type === "anura" || repo.type === "anura" ? "anura" : "terbium";
			indexed.push({ pkg, repo: cache.repository ?? repo, type });
		}
	}
	return indexed;
};

const resolvePackage = (packages: IndexedPackage[], query: string): IndexedPackage | undefined => {
	const normalized = query.toLocaleLowerCase();
	return packages.find(item => item.pkg.name.toLocaleLowerCase() === normalized || item.pkg.package?.toLocaleLowerCase() === normalized);
};

const appConfigForTapp = (app: JsonObject, basePath: string): JsonObject => {
	const rawTitle = app.wmArgs?.title ?? app.title ?? app.name;
	return {
		title: typeof rawTitle === "object" ? { text: rawTitle.text ?? app.name, weight: rawTitle.weight, html: rawTitle.html } : rawTitle,
		name: app.title ?? app.name,
		icon: `${basePath}${String(app.icon ?? "icon.svg").replace(/^\.\//, "")}`,
		src: `${basePath}${String(app.wmArgs?.src ?? "index.html").replace(/^\.\//, "")}`,
		size: app.wmArgs?.size,
		single: app.wmArgs?.single,
		resizable: app.wmArgs?.resizable,
		controls: app.wmArgs?.controls,
		message: app.wmArgs?.message,
		snapable: app.wmArgs?.snapable,
		advanced: app.wmArgs?.advanced,
	};
};

const extractZip = async (api: RuntimeApi, url: string, target: string): Promise<void> => {
	const response = await api.libcurl.fetch(url);
	if (!response.ok) throw new Error(`download failed (${response.status} ${response.statusText})`);
	const files = api.fflate.unzipSync(toBytes(await response.arrayBuffer()));
	await ensureDir(api, target);
	for (const [relative, content] of Object.entries(files)) {
		const normalized = relative.replaceAll("\\", "/");
		if (!normalized || normalized.startsWith("/") || normalized.split("/").some(part => part === "..")) throw new Error(`unsafe archive path: ${relative}`);
		if (normalized.endsWith("/")) {
			await ensureDir(api, `${target}/${normalized.replace(/\/+$/, "")}`);
			continue;
		}
		const path = `${target}/${normalized}`;
		await ensureDir(api, path.slice(0, path.lastIndexOf("/")));
		await api.fs.promises.writeFile(path, api.buffer.from(content));
	}
};

const versionAllowed = async (api: RuntimeApi, pkg: PackageRecord): Promise<string | null> => {
	const requirements = pkg.requirements;
	if (typeof requirements?.os === "string") {
		const required = requirements.os
			.replace(/^[^\d]*/, "")
			.split(".")
			.map(Number);
		const current = String(api.system.version())
			.replace(/^[^\d]*/, "")
			.split(".")
			.map(Number);
		for (let i = 0; i < Math.max(required.length, current.length); i++) {
			if ((current[i] ?? 0) > (required[i] ?? 0)) break;
			if ((current[i] ?? 0) < (required[i] ?? 0)) return `requires TerbiumOS ${requirements.os} or newer`;
		}
	}
	if (typeof requirements?.proxy === "string" && requirements.proxy !== (await api.proxy.get())) return `requires ${requirements.proxy} as the configured proxy`;
	return null;
};

const installOne = async (api: RuntimeApi, item: IndexedPackage): Promise<string> => {
	const { pkg, repo, type } = item;
	const incompatible = await versionAllowed(api, pkg);
	if (incompatible) throw new Error(`${pkg.name} ${incompatible}`);
	const installed = await getInstalled(api);
	const name = safeName(pkg.name);
	const username = await api.user.username();
	if (type === "anura" || pkg["anura-pkg"] || pkg.package) {
		const appName = safeName(pkg.name || pkg.package || "anura-app");
		const target = `${ROOT}/anura/${appName}`;
		const manifestUrl = pkg["anura-pkg"] ?? `${repo.url.replace(/(?:manifest|list)\.json(?:\?.*)?$/, "")}/apps/${encodeURIComponent(pkg.package ?? appName)}/${pkg.data ?? ""}`;
		const baseUrl = manifestUrl.replace(/\/$/, "");
		await api.fs.promises.rm(target, { recursive: true, force: true });
		await installArchiveOrDirectory(api, manifestUrl, baseUrl, target);
		const manifestPath = `${target}/manifest.json`;
		const manifest = await readJson<JsonObject>(api, manifestPath, {} as JsonObject);
		if (!manifest.name || !manifest.package) throw new Error(`invalid Anura app manifest at ${manifestPath}`);
		const record: InstalledRecord = { name: manifest.name, user: username, config: manifestPath, package: manifest.package, version: pkg.version, type: "anura", repository: repo.url };
		await replaceInstalled(api, installed, record);
		try {
			const anura = (globalThis as typeof globalThis & { window?: { anura?: { registerExternalApp(source: string): Promise<unknown> } } }).window?.anura;
			if (anura) await anura.registerExternalApp(`/fs${target}`);
		} catch (error) {
			throw new Error(`installed files, but Anura registration failed: ${String(error)}`);
		}
		return `Installed ${record.name} (${pkg.version ?? "version unknown"}) from ${repo.name ?? repo.url}`;
	}

	if (pkg["pkg-download"]) {
		const target = `${ROOT}/system/${name}.tapp`;
		await api.fs.promises.rm(target, { recursive: true, force: true });
		await extractZip(api, pkg["pkg-download"], target);
		const configPath = `${target}/.tbconfig`;
		const config = await readJson<JsonObject | null>(api, configPath, null);
		if (!config?.wmArgs) throw new Error(`package archive is missing a valid .tbconfig: ${pkg.name}`);
		await api.launcher.addApp(appConfigForTapp(config, `/fs${target}/`));
		const record: InstalledRecord = { name: config.title ?? pkg.name, user: username, config: configPath, version: pkg.version, type: "tapp", repository: repo.url };
		await replaceInstalled(api, installed, record);
		return `Installed ${record.name} (${pkg.version ?? "version unknown"}) from ${repo.name ?? repo.url}`;
	}

	const webRecord = await installWebApp(api, pkg, username, repo);
	await replaceInstalled(api, installed, webRecord);
	return `Installed ${webRecord.name} (${pkg.version ?? "version unknown"}) from ${repo.name ?? repo.url}`;
};

const installArchiveOrDirectory = async (api: RuntimeApi, packageUrl: string, baseUrl: string, target: string): Promise<void> => {
	if (packageUrl.endsWith(".zip")) {
		await extractZip(api, packageUrl, target);
		return;
	}
	const manifestUrl = `${baseUrl.replace(/\/$/, "")}/manifest.json`;
	const manifest = await fetchJson(api, manifestUrl);
	await ensureDir(api, target);
	await api.fs.promises.writeFile(`${target}/manifest.json`, JSON.stringify(manifest, null, 2), "utf8");
	const files = [manifest.index, manifest.icon, manifest.background].filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
	for (const relative of new Set(files)) {
		const normalized = relative.replaceAll("\\", "/");
		if (normalized.startsWith("/") || normalized.split("/").some(part => part === "..")) throw new Error(`unsafe Anura manifest path: ${relative}`);
		const response = await api.libcurl.fetch(`${baseUrl.replace(/\/$/, "")}/${normalized.replace(/^\.\//, "")}`);
		if (!response.ok) throw new Error(`failed to download ${relative}: HTTP ${response.status}`);
		const destination = `${target}/${normalized}`;
		await ensureDir(api, destination.slice(0, destination.lastIndexOf("/")));
		await api.fs.promises.writeFile(destination, api.buffer.from(toBytes(await response.arrayBuffer())));
	}
};

const installWebApp = async (api: RuntimeApi, pkg: PackageRecord, username: string, repo: Repository): Promise<InstalledRecord> => {
	const pkgName = pkg["pkg-name"] ?? pkg.package ?? pkg.name.toLowerCase().replaceAll(/\s+/g, "-");
	const appPath = `${ROOT}/user/${username}/${safeName(pkg.name)}`;
	await ensureDir(api, appPath);
	const config: JsonObject = {
		name: pkg.name,
		icon: pkg.icon,
		description: pkg.description,
		authors: pkg.authors,
		"pkg-name": pkgName,
		version: pkg.version,
		images: pkg.images,
		wmArgs: pkg.wmArgs,
	};
	await writeJson(api, `${appPath}/index.json`, config);
	const webIndex = await readJson<JsonObject>(api, `${ROOT}/web_apps.json`, { apps: [] });
	if (!Array.isArray(webIndex.apps)) webIndex.apps = [];
	if (!webIndex.apps.includes(pkgName)) webIndex.apps.push(pkgName);
	await writeJson(api, `${ROOT}/web_apps.json`, webIndex);
	if (pkg.wmArgs?.title && pkg.wmArgs?.src && pkg.wmArgs?.size) {
		await api.launcher.addApp({
			title: pkg.wmArgs.title,
			name: pkg.name,
			icon: pkg.icon,
			src: pkg.wmArgs.src,
			size: pkg.wmArgs.size,
			...pkg.wmArgs,
		});
	}
	return { name: pkg.name, user: username, config: `${appPath}/index.json`, package: pkgName, version: pkg.version, type: "web", repository: repo.url };
};

const replaceInstalled = async (api: RuntimeApi, installed: InstalledRecord[], record: InstalledRecord): Promise<void> => {
	const filtered = installed.filter(item => item.name.toLowerCase() !== record.name.toLowerCase() && (!record.package || item.package !== record.package));
	filtered.push(record);
	await setInstalled(api, filtered);
};

const removeOne = async (api: RuntimeApi, query: string): Promise<string> => {
	const installed = await getInstalled(api);
	const matches = installed.filter(app => app.name.toLowerCase() === query.toLowerCase() || app.package?.toLowerCase() === query.toLowerCase());
	if (!matches.length) throw new Error(`package is not installed: ${query}`);
	for (const app of matches) {
		const configPath = app.config;
		if (configPath.endsWith(".tbconfig")) {
			const directory = configPath.slice(0, -".tbconfig".length).replace(/\/$/, "");
			await api.launcher.removeApp(app.name).catch(() => {});
			await api.fs.promises.rm(directory, { recursive: true, force: true });
		} else if (configPath.endsWith("manifest.json")) {
			const directory = configPath.slice(0, -"manifest.json".length).replace(/\/$/, "");
			await api.launcher.removeApp(app.name).catch(() => {});
			await api.fs.promises.rm(directory, { recursive: true, force: true });
			const webApps = (globalThis as typeof globalThis & { window?: { anura?: { apps?: JsonObject } } }).window?.anura?.apps;
			if (webApps && app.package) delete webApps[app.package];
		} else if (configPath.endsWith("index.json")) {
			const directory = configPath.slice(0, -"index.json".length).replace(/\/$/, "");
			await api.launcher.removeApp(app.name).catch(() => {});
			await api.fs.promises.rm(directory, { recursive: true, force: true });
			const webIndex = await readJson<JsonObject>(api, `${ROOT}/web_apps.json`, { apps: [] });
			if (Array.isArray(webIndex.apps) && app.package) webIndex.apps = webIndex.apps.filter((item: string) => item !== app.package);
			await writeJson(api, `${ROOT}/web_apps.json`, webIndex);
		}
	}
	await setInstalled(
		api,
		installed.filter(app => !matches.includes(app)),
	);
	return `Removed ${matches.map(app => app.name).join(", ")}`;
};

const run = async ({ args }: HostBinaryContext): Promise<HostBinaryResult> => {
	const api = getApi();
	const [command = "help", ...rest] = args;
	try {
		switch (command) {
			case "help":
			case "-h":
			case "--help":
				return { status: 0, stdout: HELP };
			case "repo":
				return await runRepo(api, rest);
			case "update":
				return await refresh(api, rest[0]);
			case "search":
				return await search(api, rest.join(" "));
			case "show":
			case "info":
				return await show(api, rest[0]);
			case "list":
			case "installed":
				return await list(api, rest.includes("--upgradable"));
			case "install":
			case "add":
				return await install(api, rest);
			case "remove":
			case "purge":
			case "uninstall":
				return await remove(api, rest);
			case "upgrade":
			case "full-upgrade":
				return await upgrade(api, rest);
			case "clean":
				return await clean(api);
			case "version":
			case "--version":
				return { status: 0, stdout: "TPKG 3.0.0\n" };
			default:
				return { status: 2, stderr: `pkg: unknown command '${command}'\nTry 'pkg help' for usage.\n` };
		}
	} catch (error) {
		return { status: 1, stderr: `pkg: ${error instanceof Error ? error.message : String(error)}\n` };
	}
};

const runRepo = async (api: RuntimeApi, args: string[]): Promise<HostBinaryResult> => {
	const [action, ...values] = args;
	const repositories = await getRepositories(api);
	if (!action || action === "list" || action === "ls") {
		if (!repositories.length) return { status: 0, stdout: "No repositories configured.\n" };
		return { status: 0, stdout: `${repositories.map((repo, index) => `${index + 1}. ${repo.name ?? repo.url}\n   ${repo.url}\n   type: ${repo.type ?? "auto"}; ${repo.enabled === false ? "disabled" : "enabled"}`).join("\n")}\n` };
	}
	if (action === "add" || action === "enable" || action === "disable") {
		const url = values[0];
		if (!url) return { status: 2, stderr: `Usage: pkg repo ${action} <url> [name]\n` };
		if (action === "add") {
			if (!/^https?:\/\//i.test(url)) return { status: 2, stderr: "pkg: repository URL must use HTTP or HTTPS\n" };
			if (repositories.some(repo => repo.url === url)) return { status: 0, stdout: `Repository already configured: ${url}\n` };
			const probe = await fetchJson(api, url);
			const type = repositoryType({ url, type: "auto" }, probe);
			repositories.push({ url, name: values.slice(1).join(" ") || new URL(url).hostname, type });
			await writeJson(api, REPOS_PATH, repositories);
			return { status: 0, stdout: `Added ${repositories.at(-1)?.name ?? url} (${type})\nRun 'pkg update' to refresh package lists.\n` };
		}
		const repo = repositories.find(item => item.url === url || item.name?.toLowerCase() === url.toLowerCase());
		if (!repo) return { status: 1, stderr: `pkg: repository not found: ${url}\n` };
		repo.enabled = action === "enable";
		await writeJson(api, REPOS_PATH, repositories);
		return { status: 0, stdout: `${action === "enable" ? "Enabled" : "Disabled"} ${repo.name ?? repo.url}\n` };
	}
	if (action === "remove" || action === "rm") {
		const query = values[0];
		if (!query) return { status: 2, stderr: "Usage: pkg repo remove <url|name>\n" };
		const filtered = repositories.filter(repo => repo.url !== query && repo.name?.toLowerCase() !== query.toLowerCase());
		if (filtered.length === repositories.length) return { status: 1, stderr: `pkg: repository not found: ${query}\n` };
		await writeJson(api, REPOS_PATH, filtered);
		return { status: 0, stdout: `Removed repository ${query}\n` };
	}
	return { status: 2, stderr: "Usage: pkg repo [list|add|remove|enable|disable] ...\n" };
};

const search = async (api: RuntimeApi, term: string): Promise<HostBinaryResult> => {
	if (!term) return { status: 2, stderr: "Usage: pkg search <term>\n" };
	const packages = await allPackages(api);
	if (!packages.length) return { status: 1, stderr: "pkg: package indexes are empty; run 'pkg update' first\n" };
	const matches = packages.filter(({ pkg }) => `${pkg.name} ${pkg.description ?? ""} ${pkg.package ?? ""}`.toLowerCase().includes(term.toLowerCase()));
	if (!matches.length) return { status: 0, stdout: `No packages found matching '${term}'.\n` };
	return { status: 0, stdout: `${matches.map(({ pkg, repo }) => `${pkg.name.padEnd(32)} ${pkg.version ?? "?".padEnd(12)} ${pkg.description ?? ""}${repo.name ? ` [${repo.name}]` : ""}`).join("\n")}\n` };
};

const show = async (api: RuntimeApi, name?: string): Promise<HostBinaryResult> => {
	if (!name) return { status: 2, stderr: "Usage: pkg show <package>\n" };
	const item = resolvePackage(await allPackages(api), name);
	if (!item) return { status: 1, stderr: `pkg: package not found: ${name}\n` };
	return {
		status: 0,
		stdout: `${[
			`Package: ${item.pkg.name}`,
			`Version: ${item.pkg.version ?? "unknown"}`,
			`Repository: ${item.repo.name ?? item.repo.url}`,
			`Type: ${item.type}`,
			`Description: ${item.pkg.description ?? "(none)"}`,
			`Package ID: ${item.pkg.package ?? "(none)"}`,
			`Download: ${item.pkg["pkg-download"] ?? item.pkg["anura-pkg"] ?? "repository-managed"}`,
		].join("\n")}\n`,
	};
};

const list = async (api: RuntimeApi, upgradableOnly: boolean): Promise<HostBinaryResult> => {
	const installed = await getInstalled(api);
	const packages = await allPackages(api);
	const records = installed.flatMap(app => {
		const available = resolvePackage(packages, app.package ?? app.name);
		const upgrade = available && available.pkg.version !== app.version;
		if (upgradableOnly && !upgrade) return [];
		return [{ app, available }];
	});
	if (!records.length) return { status: 0, stdout: upgradableOnly ? "All installed packages are up to date.\n" : "No installed packages.\n" };
	return { status: 0, stdout: `${records.map(({ app, available }) => `${app.name.padEnd(32)} ${app.version ?? "installed"}${available && available.pkg.version !== app.version ? `  [upgradable: ${available.pkg.version}]` : ""}`).join("\n")}\n\n${records.length} package(s) installed.\n` };
};

const install = async (api: RuntimeApi, names: string[]): Promise<HostBinaryResult> => {
	if (!names.length) return { status: 2, stderr: "Usage: pkg install <package ...>\n" };
	const packages = await allPackages(api);
	if (!packages.length) return { status: 1, stderr: "pkg: package indexes are empty; run 'pkg update' first\n" };
	const output: string[] = [];
	const errors: string[] = [];
	for (const name of names) {
		const item = resolvePackage(packages, name);
		if (!item) {
			errors.push(`Unable to locate package ${name}`);
			continue;
		}
		try {
			output.push(await installOne(api, item));
		} catch (error) {
			errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return { status: errors.length ? 1 : 0, stdout: output.length ? `${output.join("\n")}\n` : undefined, stderr: errors.length ? `${errors.join("\n")}\n` : undefined };
};

const remove = async (api: RuntimeApi, names: string[]): Promise<HostBinaryResult> => {
	if (!names.length) return { status: 2, stderr: "Usage: pkg remove <package ...>\n" };
	const output: string[] = [];
	const errors: string[] = [];
	for (const name of names) {
		try {
			output.push(await removeOne(api, name));
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
		}
	}
	return { status: errors.length ? 1 : 0, stdout: output.length ? `${output.join("\n")}\n` : undefined, stderr: errors.length ? `${errors.join("\n")}\n` : undefined };
};

const upgrade = async (api: RuntimeApi, selectedNames: string[]): Promise<HostBinaryResult> => {
	const installed = await getInstalled(api);
	const packages = await allPackages(api);
	const targets = selectedNames.length ? installed.filter(app => selectedNames.some(name => name.toLowerCase() === app.name.toLowerCase() || name.toLowerCase() === app.package?.toLowerCase())) : installed;
	const output: string[] = [];
	const errors: string[] = [];
	for (const app of targets) {
		const available = resolvePackage(packages, app.package ?? app.name);
		if (!available) continue;
		if (available.pkg.version === app.version) continue;
		try {
			output.push(`${app.name}: ${app.version ?? "installed"} -> ${available.pkg.version ?? "latest"}`);
			output.push(await installOne(api, available));
		} catch (error) {
			errors.push(`${app.name}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	if (!output.length && !errors.length) return { status: 0, stdout: "All installed packages are up to date.\n" };
	return { status: errors.length ? 1 : 0, stdout: output.length ? `${output.join("\n")}\n` : undefined, stderr: errors.length ? `${errors.join("\n")}\n` : undefined };
};

const clean = async (api: RuntimeApi): Promise<HostBinaryResult> => {
	await api.fs.promises.rm(CACHE_PATH, { recursive: true, force: true });
	await api.fs.promises.rm(STATUS_PATH, { force: true });
	return { status: 0, stdout: "Removed cached package lists.\n" };
};

export const pkg: HostBinary = run;
export default pkg;

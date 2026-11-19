import AdmZip from "adm-zip";
import { exec } from "child_process";
import consola from "consola";
import fs from "fs";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import { version } from "./package.json";
import { TServer } from "./server";
import dotenv from "dotenv";

consola.info("Bootstrapping TerbiumOS [v" + version + "]");
dotenv.config();

const LITE_APPS = new Set(["About", "Calculator", "Feedback", "Files", "Settings", "Task Manager", "Terminal", "Text Editor"]);
const FRACITAL_URL = "https://github.com/TerbiumOS/vendored-assets/raw/refs/heads/main/apps/fracital.zip";
const TBROWSE_URL = "https://github.com/TerbiumOS/vendored-assets/raw/refs/heads/main/apps/tbrowse.zip";

export default async function Bootstrap() {
	const args = process.argv;
	const nodever = fs.readFileSync(".node_version", "utf-8").trim();
	if (process.version < nodever) {
		consola.warn("Your version of Node.JS is not supported. Please update node to use Terbium. (Current version: " + process.version + ", Required version: " + nodever + " or higher)");
	}
	if (!fs.existsSync(".env")) await CreateEnv();
	dotenv.config({ override: true });
	await InstallBrowser();
	await BuildApps();
	await CreateAppsPaths();
	if (args.includes("--no-updates")) {
		consola.warn("Update checking has been skipped (--no-updates). This is discouraged; keep update checking enabled when possible.");
	} else {
		await Updater();
	}
	consola.success("TerbiumOS bootstrapped successfully");
	if (!(args.includes("--apps-only") || args.includes("--dev"))) {
		TServer();
	}
}

function edition(): "normal" | "lite" {
	return process.env.Edition?.toLowerCase() === "lite" ? "lite" : "normal";
}

async function InstallBrowser() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const browserDir = path.join(__dirname, "public/apps/browser.tapp");
	const marker = path.join(browserDir, ".terbium-edition");
	const selectedEdition = edition();

	if (fs.existsSync(marker) && fs.readFileSync(marker, "utf-8").trim() === selectedEdition) return;
	consola.start(`Installing ${selectedEdition} browser...`);

	const isCloudflare = process.env.CF_PAGES === "1" || process.env.WORKERS_CI === "1";
	if (isCloudflare) {
		consola.info("Detected Cloudflare environment; using TBrowse browser for compatibility.");
	}

	let archive: AdmZip;
	const url = isCloudflare ? "https://github.com/TerbiumOS/vendored-assets/raw/refs/heads/main/apps/tbrowse.zip" : (selectedEdition === "lite" ? "https://github.com/TerbiumOS/vendored-assets/raw/refs/heads/main/apps/tbrowse.zip" : "https://github.com/TerbiumOS/vendored-assets/raw/refs/heads/main/apps/fracital.zip");
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		archive = new AdmZip(Buffer.from(await response.arrayBuffer()));
	} catch (error) {
		if (fs.existsSync(browserDir)) fs.rmSync(browserDir, { recursive: true, force: true });
		consola.error(`The ${selectedEdition} browser could not be downloaded (${url}): ${error}. The browser is not included, but it can be downloaded again later.`);
		return;
	}

	if (fs.existsSync(browserDir)) fs.rmSync(browserDir, { recursive: true, force: true });
	const prefix = selectedEdition === "lite" ? "public/apps/browser.tapp/" : "";
	for (const entry of archive.getEntries()) {
		if (entry.isDirectory || !entry.entryName.startsWith(prefix)) continue;
		const relative = entry.entryName.slice(prefix.length);
		if (!relative || relative.includes("..")) continue;
		const target = path.join(browserDir, relative);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, entry.getData());
	}
	fs.writeFileSync(marker, selectedEdition);
	consola.success(`Installed ${selectedEdition} browser`);
}

export async function BuildApps() {
	consola.start("Building apps...");
	const __dirname = path.dirname(fileURLToPath(import.meta.url)),
		baseDir = path.join(__dirname, "./public/apps"),
		outputDir = path.join(__dirname, "./src"),
		outputJsonPath = path.join(outputDir, "apps.json"),
		result: { name: string; config: any }[] = [];
	function scanDirectory(dir: string) {
		fs.readdirSync(dir, { withFileTypes: true }).forEach(i => {
			if (i.isDirectory()) {
				const indexFilePath = path.join(dir, i.name, "index.json");
				if (fs.existsSync(indexFilePath)) {
					try {
						const data = JSON.parse(fs.readFileSync(indexFilePath, "utf-8"));
						if (data.name && data.config) {
							const appName = data.name === "Fracital" ? "Browser" : data.name;
							if (edition() === "lite" && !LITE_APPS.has(appName)) return;
							if (data.name !== "Browser") {
								data.config.src = data.config.src.replace(`/apps/${data.name.toLowerCase()}.tapp/`, `/fs/apps/system/${data.name.toLowerCase()}.tapp/`);
								data.config.icon = data.config.icon.replace(`/apps/${data.name.toLowerCase()}.tapp/`, `/fs/apps/system/${data.name.toLowerCase()}.tapp/`);
							}
							result.push({ name: appName, config: data.config });
						}
					} catch (t) {
						consola.error(`Error parsing ${indexFilePath}:`, t instanceof Error ? t.message : String(t));
					}
				}
			} else if (i.name.endsWith(".tapp.zip")) {
				const zipPath = path.join(dir, i.name);
				try {
					const zip = new AdmZip(zipPath);
					const configEntry = zip.getEntry(".tbconfig");
					if (configEntry) {
						const configData = JSON.parse(configEntry.getData().toString("utf-8"));
						if (configData.title && configData.wmArgs && (edition() !== "lite" || LITE_APPS.has(configData.title))) {
							result.push({ name: configData.title, config: configData.wmArgs });
						}
					}
				} catch (t) {
					consola.error(`Error reading ${zipPath}:`, t instanceof Error ? t.message : String(t));
				}
			}
		});
	}
	scanDirectory(baseDir),
		fs.existsSync(path.join(__dirname, "./build")) || fs.mkdirSync(path.join(__dirname, "./build")),
		fs.existsSync(outputJsonPath) || fs.writeFileSync(outputJsonPath, "[]", "utf-8"),
		fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), "utf-8"),
		consola.success(`Aggregated JSON saved to ${outputJsonPath}`);
	exec("git rev-parse HEAD", (error, stdout, stderr) => {
		if (error || stderr) {
			consola.error("Failed to get git commit hash");
			fs.writeFileSync(path.join(__dirname, "./src/hash.json"), JSON.stringify({ hash: "2b14b5", repository: "terbiumos/web-v2" }, null, 2), "utf-8");
		} else {
			const hash = stdout.trim();
			exec("git remote get-url origin", (remoteError, remoteStdout, remoteStderr) => {
				const repoUrl = remoteStdout.trim();
				const data = { hash, repository: repoUrl.replace("https://github.com/", "") };
				if (remoteError || remoteStderr) {
					consola.error("Failed to get repository URL");
					fs.writeFileSync(path.join(__dirname, "./src/hash.json"), JSON.stringify({ hash: null, repository: null }, null, 2), "utf-8");
				} else {
					fs.writeFileSync(path.join(__dirname, "./src/hash.json"), JSON.stringify(data, null, 2), "utf-8");
					consola.success(`Git hash and repo saved to ${path.join(__dirname, "./src/hash.json")}`);
				}
			});
		}
	});
	return true;
}

export async function CreateAppsPaths() {
	interface Apps {
		[appName: string]: (string | { [path: string]: string[] })[];
	}
	consola.start("Creating apps paths...");

	const __dirname = path.dirname(fileURLToPath(import.meta.url)),
		baseDir = path.join(__dirname, "./public/apps"),
		outputDir = path.join(__dirname, "./src"),
		outputJsonPath = path.join(outputDir, "installer.json"),
		output: string[] = [];

	function collectPaths(dir: string, base: string = dir): void {
		const files: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });
		files.forEach((file: fs.Dirent) => {
			const fullPath = path.join(dir, file.name);
			const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
			if (file.isDirectory()) {
				output.push(relativePath + "/");
				collectPaths(fullPath, base);
			} else {
				output.push(relativePath);
			}
		});
	}

	const accmp: string[] = [];
	fs.readdirSync(baseDir, { withFileTypes: true }).forEach(app => {
		if (app.isDirectory() && app.name.toLocaleLowerCase().endsWith(".tapp")) {
			const appPath = path.join(baseDir, app.name);
			if (app.name.toLowerCase() === "settings.tapp") {
				collectPaths(appPath);
				if (fs.existsSync(path.join(appPath, "accounts"))) {
					collectPaths(path.join(appPath, "accounts"));
					accmp.push(...output.splice(output.indexOf("settings.tapp/accounts/")));
				}
			} else {
				collectPaths(appPath);
			}
		} else if (app.name.toLowerCase().endsWith(".tapp.zip")) {
			accmp.push(app.name);
		}
	});

	output.push(...accmp);
	fs.writeFileSync(outputJsonPath, JSON.stringify(output, null, 2), "utf-8");
	consola.success(`Installer JSON saved to ${outputJsonPath}`);
	return true;
}

export async function CreateEnv() {
	const selectedEdition = await consola.prompt("Choose an edition (normal): ", {
		type: "select",
		options: ["normal", "lite"],
		initial: "normal",
		cancel: "default",
	});
	const port =
		(await consola.prompt("Enter a port for the server to run on (3000): ", {
			type: "text",
			default: "3000",
			placeholder: "3000",
			cancel: "default",
		})) || 3000;
	const wispPort =
		(await consola.prompt("Enter a port for the Wisp server to run on (3001): ", {
			type: "text",
			default: "3001",
			placeholder: "3001",
			cancel: "default",
		})) || 3001;
	const externalWispServer = await consola.prompt("External Wisp server URL (leave blank to use built-in): ", {
		type: "text",
		default: "",
		placeholder: "wss://wisp.example.com/wisp/",
		cancel: "default",
	});
	const reputation = await consola.prompt("Path to IP reputation storage (leave blank to disable): ", {
		type: "text",
		default: "",
		placeholder: "./data/reputation.json",
		cancel: "default",
	});
	const activation = await consola.prompt("Enable MASQR-v2 Activation System? (no): ", {
		type: "text",
		default: "false",
		placeholder: "no",
		cancel: "default",
	});

	let envContent = `Edition=${selectedEdition || "normal"}\n`;

	if (reputation) {
		envContent += `REPUTATION_STORE=${reputation}\n`;
	} else {
		envContent += "REPUTATION_STORE=\n";
	}

	if (externalWispServer) {
		envContent += `VITE_WISP_SERVER=${externalWispServer}\n`;
	}

	if (activation === "no" || activation === "false" || activation === "n") {
		envContent += `VITE_ACTIVATION_ENABLED=false\nPORT=${port}\nWISP_PORT=${wispPort}`;
	} else {
		const licenseServer = (await consola.prompt("Enter the MASQR-v2 license server URL (e.g., http://localhost:4000): ")) || "";
		envContent += `VITE_ACTIVATION_ENABLED=true\nPORT=${port}\nWISP_PORT=${wispPort}\nLICENSE_SERVER_URL=${licenseServer}\n`;
	}

	fs.writeFileSync(".env", envContent);
	consola.success("Environment file created");
	return true;
}

export async function Updater() {
	consola.start("Checking for updates...");
	exec("git remote get-url origin", async (remoteError, remoteStdout, remoteStderr) => {
		if (remoteError || remoteStderr) {
			consola.error("Failed to get local repository URL");
			return;
		}
		const repo = `https://raw.githubusercontent.com/${remoteStdout.trim().replace("https://github.com/", "").replace(".git", "")}/refs/heads/main/package.json` || "https://raw.githubusercontent.com/TerbiumOS/web-v2/refs/heads/main/package.json";
		try {
			const response = await fetch(repo);
			const ver = (await response.json()).version;
			if (ver > version) {
				const res = await consola.prompt(`A new version of Terbium is available. Would you like to download it? (New Version: ${ver}, Current: ${version})`, {
					type: "confirm",
				});
				if (res) {
					consola.info("Downloading new version...");
					exec("git pull", async (remoteError, remoteStdout, remoteStderr) => {
						if (remoteError || remoteStderr) {
							consola.error("Failed to update Terbium, Please update manually");
							open(`${remoteStdout.trim()}/releases/latest`);
							return;
						}
						consola.success("Terbium updated successfully");
						await BuildApps();
						await CreateAppsPaths();
					});
					return;
				}
				return;
			}
			consola.success("Terbium is up to date");
		} catch (e) {
			consola.error(`Failed to check for updates, ${e}`);
		}
	});
	return true;
}

Bootstrap();

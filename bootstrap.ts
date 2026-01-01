import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import consola from "consola";
import { TServer } from "./server";
import { version } from "./package.json";
import open from "open";
import { exec } from "child_process";
import AdmZip from "adm-zip";

consola.info("Bootstrapping TerbiumOS [v" + version + "]");

export default async function Bootstrap() {
	const args = process.argv;
	await BuildApps();
	await CreateAppsPaths();
	if (!fs.existsSync(".env")) await CreateEnv();
	await Updater();
	consola.success("TerbiumOS bootstrapped successfully");
	if (!(args.includes("--apps-only") || args.includes("--dev"))) {
		TServer();
	}
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
							if (data.name !== "Browser") {
								data.config.src = data.config.src.replace(`/apps/${data.name.toLowerCase()}.tapp/`, `/fs/apps/system/${data.name.toLowerCase()}.tapp/`);
								data.config.icon = data.config.icon.replace(`/apps/${data.name.toLowerCase()}.tapp/`, `/fs/apps/system/${data.name.toLowerCase()}.tapp/`);
							}
							result.push({ name: data.name, config: { ...data.wmArgs, src: `/fs/apps/system/${data.name.toLowerCase()}.tapp/${data.wmArgs.src}`, icon: `/fs/apps/system/${data.name.toLowerCase()}.tapp/${data.wmArgs.icon}` } });
						}
					} catch (t) {
						consola.error(`Error parsing ${indexFilePath}:`, t instanceof Error ? t.message : String(t));
					}
				}
			} else if (i.name.endsWith(".zip")) {
				const zipPath = path.join(dir, i.name);
				try {
					const zip = new AdmZip(zipPath);
					const configEntry = zip.getEntry(".tbconfig");
					if (configEntry) {
						const configData = JSON.parse(configEntry.getData().toString("utf-8"));
						if (configData.title && configData.wmArgs) {
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
		} else if (app.name.toLowerCase().endsWith(".zip")) {
			accmp.push(app.name);
		}
	});

	output.push(...accmp);
	fs.writeFileSync(outputJsonPath, JSON.stringify(output, null, 2), "utf-8");
	consola.success(`Installer JSON saved to ${outputJsonPath}`);
	return true;
}

export async function CreateEnv() {
	const port =
		(await consola.prompt("Enter a port for the server to run on (3000): ", {
			type: "text",
			default: "3000",
			placeholder: "3000",
			cancel: "default",
		})) || 3000;
	const masqr = await consola.prompt("Enable Masqr? (no): ", {
		type: "text",
		default: "false",
		placeholder: "no",
		cancel: "default",
	});
	if (masqr === "no" || masqr === "false" || masqr === "n") {
		fs.writeFileSync(".env", `MASQR=${false}\nPORT=${port}`);
	} else {
		const licenseServer = (await consola.prompt("Enter the masqr license server URL: ")) || "";
		const whitelist = (await consola.prompt("Enter a comma separated array of domains to whitelist (Ex: ['https://balls.com', 'https://tomp.app']): ")) || [];
		fs.writeFileSync(".env", `MASQR=${true}\nPORT=${port}\nLICENSE_SERVER_URL=${licenseServer}\nWHITELISTED_DOMAINS=${whitelist}\n`);
	}
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
				} else return;
			} else {
				consola.success("Terbium is up to date");
			}
		} catch (e) {
			consola.error(`Failed to check for updates, ${e}`);
		}
	});
	return true;
}

Bootstrap();

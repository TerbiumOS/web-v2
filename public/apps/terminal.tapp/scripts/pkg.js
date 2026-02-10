async function pkg(args) {
	let availableCommands = [
		"pkg <command> -h: Display help for <command>.",
		"pkg install <package-name>: Install an app matching <package-name> from the repo.",
		"pkg remove <package-name>: Uninstall an app matching <package-name> from the repo.",
		"pkg update: <package-name>: Update a package to the latest version if available.",
		"pkg list: Shows a list of installed apps.",
		"pkg search <package-name>: Search for an app matching <package-name> in the repo.",
		"pkg repo: Changes the Package Managers Fetch repo (Use -r to remove the repo you added)",
	];
	let repo = sessionStorage.getItem("pkg-repo") || JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"))[0].url;
	let rType = sessionStorage.getItem("pkg-type") || "terbium";
	switch (args._[0]) {
		case "install":
			if (args._[1]) {
				const response = await tb.libcurl.fetch(repo);
				let repoData = rType === "terbium" ? (await response.json()).apps : (await (await tb.libcurl.fetch(repo.replace("manifest.json", "list.json"))).json()).apps;
				const packageName = args._[1];
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === packageName.toLowerCase());
				if (exactMatch) {
					displayOutput(`Installing ${exactMatch.name}...`);
					if (exactMatch.requirements) {
						if (exactMatch.requirements.os && semverCompare(exactMatch.requirements.os, window.parent.tb.system.version()) > 0) {
							displayError(`This app requires terbium version: ${exactMatch.requirements.os} or later`);
							createNewCommandInput();
							return;
						} else if (exactMatch.requirements.proxy && exactMatch.requirements.proxy !== (await window.parent.tb.proxy.get())) {
							displayError(`This app requires ${exactMatch.requirements.proxy} as the default proxy.`);
							createNewCommandInput();
							return;
						}
					}
					const installed = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
					let type;
					if ("pkg-download" in exactMatch) {
						type = "TAPP";
					} else if ("anura-pkg" in exactMatch || rType === "anura") {
						type = "anura";
					} else {
						type = "web";
					}
					if (installed.some(app => app.name.toLowerCase() === exactMatch.name.toLowerCase())) {
						displayOutput(`The app "${exactMatch.name}" is already installed.`);
						displayOutput("Do you want to reinstall it? (y/n)");
						term.write("\r\n> ");
						const onData = async function (input) {
							const userInput = input.trim().toLowerCase();
							if (userInput === "y") {
								displayOutput("");
								displayOutput(`Reinstalling ${exactMatch.name}...`);
								await tb.launcher.removeApp(exactMatch.name);
								await installApp(exactMatch, type, installed);
								displayOutput(`${exactMatch.name} reinstalled successfully!`);
								createNewCommandInput();
							} else {
								createNewCommandInput();
							}
							disposable.dispose();
						};
						const disposable = term.onData(onData);
						return;
					} else {
						await installApp(exactMatch, type, installed);
						displayOutput(`${exactMatch.name} installed successfully!`);
						createNewCommandInput();
						return;
					}
				} else {
					displayOutput(`No package found with the name "${packageName}".`);
					createNewCommandInput();
					return;
				}
			} else {
				displayOutput("Usage: pkg install <package-name>");
				createNewCommandInput();
				return;
			}
		case "remove":
			if (args._[1]) {
				const packageName = args._[1];
				let installed = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
				const appIndex = installed.findIndex(app => app.name.toLowerCase() === packageName.toLowerCase());
				if (appIndex !== -1) {
					const app = installed[appIndex];
					installed.splice(appIndex, 1);
					await window.parent.tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify(installed, null, 2), "utf8");
					displayOutput(`Uninstalling ${app.name}...`);
					const configPath = app.config;
					console.log(configPath);
					if (configPath.endsWith("index.json")) {
						let webApps = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/web_apps.json", "utf8"));
						if (Array.isArray(webApps.apps)) {
							const waIndex = webApps.apps.findIndex(webApp => webApp.name && webApp.name.toLowerCase() === app.name.toLowerCase());
							if (waIndex !== -1) {
								webApps.apps.splice(waIndex, 1);
								await window.parent.tb.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(webApps, null, 2), "utf8");
								await tb.launcher.removeApp(app.name);
								displayOutput(`${app.name} has been uninstalled.`);
							}
						}
					} else if (configPath.endsWith("manifest.json")) {
						try {
							await window.parent.tb.fs.promises.unlink(`/system/etc/anura/configs/${app.name}.json`);
							await tb.sh.rm(configPath.replace("/manifest.json", "/"), { recursive: true });
						} catch {}
						await tb.sh.rm(`/apps/anura/${app.name}`, { recursive: true });
						await tb.launcher.removeApp(app.name);
						delete window.parent.anura.apps[app.package];
						displayOutput(`${app.name} has been uninstalled.`);
					} else if (configPath.endsWith(".tbconfig")) {
						await tb.sh.rm(configPath.replace("/.tbconfig", "/"), { recursive: true });
						await tb.launcher.removeApp(app.name);
						displayOutput(`${app.name} has been uninstalled.`);
					}
				} else {
					displayOutput(`No installed app found with the name "${packageName}".`);
				}
				createNewCommandInput();
			} else {
				displayOutput("Usage: pkg remove <package-name>");
				createNewCommandInput();
			}
			break;
		case "update":
			if (args._[1]) {
				displayOutput("Checking for updates...");
				const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/system/${args._[1].toLowerCase()}.tapp/.tbconfig`, "utf8"));
				const response = await tb.libcurl.fetch(repo);
				let repoData = rType === "terbium" ? (await response.json()).apps : (await (await tb.libcurl.fetch(repo.replace("manifest.json", "list.json"))).json()).apps;
				const packageName = args._[1];
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === packageName.toLowerCase());
				if (exactMatch.requirements) {
					if (exactMatch.requirements.os && semverCompare(exactMatch.requirements.os, window.parent.tb.system.version()) > 0) {
						displayError(`This app requires terbium version: ${exactMatch.requirements.os} or later`);
						createNewCommandInput();
						return;
					} else if (exactMatch.requirements.proxy && exactMatch.requirements.proxy !== (await window.parent.tb.proxy.get())) {
						displayError(`This app requires ${exactMatch.requirements.proxy} as the default proxy.`);
						createNewCommandInput();
						return;
					}
				}
				if (config.version !== exactMatch.version) {
					displayOutput(`Updating ${exactMatch.name} from version ${config.version} to ${exactMatch.version}...`);
					await tb.sh.promises.rm(`/apps/system/${args._[1].toLowerCase()}.tapp/`, { recursive: true });
					await installApp(exactMatch, "TAPP");
					displayOutput(`${exactMatch.name} updated successfully!`);
					createNewCommandInput();
				}
			} else {
				displayOutput("Usage: pkg update <package-name>");
				createNewCommandInput();
				return;
			}
			break;
		case "list":
			displayOutput("Installed Packages for this system:");
			const installed = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
			for (const app of installed) {
				displayOutput(`${app.name} - ${app.user}`);
			}
			displayOutput("");
			displayOutput(`${installed.length} are installed.`);
			createNewCommandInput();
			break;
		case "search":
			if (args._[1]) {
				const response = await tb.libcurl.fetch(repo);
				let repoData = rType === "terbium" ? (await response.json()).apps : (await (await tb.libcurl.fetch(repo.replace("manifest.json", "list.json"))).json()).apps;
				const searchTerm = args._[1].toLowerCase();
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === searchTerm);
				if (exactMatch) {
					displayOutput(`Found package: ${exactMatch.name}`);
				} else {
					const potentialMatches = repoData.filter(pkg => pkg.name.toLowerCase().includes(searchTerm));
					if (potentialMatches.length > 0) {
						displayOutput(`No exact match found for "${searchTerm}".`);
						displayOutput("Did you mean? Potential match(es):");
						for (const match of potentialMatches) {
							displayOutput(`  - ${match.name}`);
						}
					} else {
						displayOutput("No matching packages found.");
					}
				}
				createNewCommandInput();
			} else {
				displayOutput("Usage: pkg search <package-name>");
				createNewCommandInput();
				return;
			}
			break;
		case "repo":
			switch (args._[1]) {
				case "r":
				case "remove":
					let r = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"));
					r = r.filter(r => r.url !== args._[2]);
					await window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(r));
					displayOutput(`Removed ${args._[2]} from the repo list`);
					createNewCommandInput();
					break;
				case "a":
				case "add":
					let newrepo = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"));
					newrepo.push({ url: args._[2] });
					await window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(newrepo));
					displayOutput(`Added ${args._[2]} to the repo list`);
					createNewCommandInput();
					break;
				case "l":
				case "list":
					let repoList = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"));
					displayOutput("Available Repositories:");
					repoList.forEach(repo => {
						displayOutput(` - ${repo.url}`);
					});
					createNewCommandInput();
					break;
				case "s":
				case "set":
					repo = args._[2];
					try {
						const response = await fetch(repo);
						const jsonData = await response.json();
						let repoType;
						if ("repo" in jsonData) {
							repoType = "terbium";
						} else {
							repoType = "anura";
						}
						sessionStorage.setItem("pkg-repo", repo);
						sessionStorage.setItem("pkg-type", repoType);
						displayOutput(`Set repo to ${repo} (type: ${repoType})`);
					} catch (e) {
						displayError(`Failed to fetch or detect repo type: ${e.message}`);
					}
					createNewCommandInput();
					break;
				default:
					displayOutput("Usage: pkg repo <a/r/l/s> [repo-url]");
					createNewCommandInput();
					break;
			}
			break;
		case "help":
		default:
			displayOutput(`TPKG v1.4.3 - February 2026`);
			displayOutput(`Usage: pkg <command>`);
			displayOutput(" ");
			displayOutput("All commands:");
			for (let command in availableCommands) {
				command = availableCommands[command];
				let [cmd, description] = command.split(": ");
				displayOutput(`   ${cmd.padEnd(40)} ${description}`);
			}
			createNewCommandInput();
			break;
	}
}

async function installApp(app, type) {
	let repo = sessionStorage.getItem("pkg-repo") || JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"))[0].url;
	switch (type) {
		case "web":
			let appPath = `/apps/user/${await window.parent.tb.user.username()}/${app.name}`;
			let appIndex = {
				name: app.name,
				icon: app.icon,
				description: app.description,
				authors: app.authors,
				"pkg-name": app["pkg-name"],
				version: app.version,
				images: app.images,
				wmArgs: app.wmArgs,
			};
			if (!(await dirExists(appPath))) {
				await window.parent.tb.fs.promises.mkdir(appPath);
			}
			await window.parent.tb.fs.promises.writeFile(`${appPath}/index.json`, JSON.stringify(appIndex));
			let apps = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/web_apps.json", "utf8"));
			apps["apps"].push(app["pkg-name"]);
			await window.parent.tb.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(apps));
			await window.parent.tb.launcher.addApp({
				title: app["wmArgs"]["title"],
				name: app.name,
				icon: app.icon,
				src: app["wmArgs"]["src"],
				size: {
					width: app["wmArgs"]["size"]["width"],
					height: app["wmArgs"]["size"]["height"],
				},
				single: app["wmArgs"]["single"],
				resizable: app["wmArgs"]["resizable"],
				controls: app["wmArgs"]["controls"],
				message: app["wmArgs"]["message"],
				proxy: app["wmArgs"]["proxy"],
				snapable: app["wmArgs"]["snapable"],
			});
			try {
				let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
				apps.push({
					name: app.name,
					user: await window.parent.tb.user.username(),
					config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
				});
				await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
			} catch {
				await window.parent.tb.fs.promises.writeFile(
					`/apps/installed.json`,
					JSON.stringify([
						{
							name: app.name,
							user: await window.parent.tb.user.username(),
							config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
						},
					]),
				);
			}
			break;
		case "TAPP":
			const appName = app.name.toLowerCase();
			const DLPath = `/apps/${appName}`;
			const downloadUrl = app["pkg-download"];
			try {
				await tb.system.download(downloadUrl, `${DLPath}.zip`);
				const targetDirectory = `/apps/system/${appName}.tapp/`;
				await unzip(`/apps/${appName}.zip`, targetDirectory);
				const appConf = await window.parent.tb.fs.promises.readFile(`/apps/system/${appName}.tapp/.tbconfig`, "utf8");
				const appData = JSON.parse(appConf);
				await window.parent.tb.launcher.addApp({
					title:
						typeof appData.wmArgs.title === "object"
							? {
									text: appData.wmArgs.title.text,
									weight: appData.wmArgs.title.weight,
									html: appData.wmArgs.title.html,
								}
							: appData.wmArgs.title,
					name: appData.title,
					icon: `/fs/apps/system/${appName}.tapp/${appData.icon}`,
					src: `/fs/apps/system/${appName}.tapp/${appData.wmArgs.src}`,
					size: {
						width: appData.wmArgs.size.width,
						height: appData.wmArgs.size.height,
					},
					single: appData.wmArgs.single,
					resizable: appData.wmArgs.resizable,
					controls: appData.wmArgs.controls,
					message: appData.wmArgs.message,
					snapable: appData.wmArgs.snapable,
				});
				await window.parent.tb.fs.promises.unlink(`${DLPath}.zip`);
				try {
					let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
					apps.push({
						name: appName,
						user: await window.parent.tb.user.username(),
						config: `/apps/system/${appName}.tapp/.tbconfig`,
					});
					await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
				} catch {
					await window.parent.tb.fs.promises.writeFile(
						`/apps/installed.json`,
						JSON.stringify({
							name: appName,
							user: await window.parent.tb.user.username(),
							config: `/apps/system/${appName}.tapp/.tbconfig`,
						}),
					);
				}
			} catch (e) {
				displayError(`Failed to install ${appName} with reason: ${e.message}`);
				return;
			}
			break;
		case "anura":
			console.log(app);
			const aName = app.name || app.package;
			const APath = `/apps/anura/${aName}`;
			let aDL;
			if ("anura-pkg" in app) {
				aDL = app["anura-pkg"];
			} else {
				aDL = `${repo.replace("manifest.json", "")}/apps/${app.package}/${app.data}`;
			}
			try {
				await tb.system.download(aDL, `${APath}.zip`);
				const targetDirectory = `/apps/anura/${aName}/`;
				await unzip(`/apps/anura/${aName}.zip`, targetDirectory);
				const appConf = await window.parent.tb.fs.promises.readFile(`/apps/anura/${aName}/manifest.json`, "utf8");
				const appData = JSON.parse(appConf);
				await window.parent.tb.launcher.addApp({
					name: appData.name,
					title: appData.wininfo.title,
					icon: `/fs/apps/anura/${app.name}/${appData.icon}`,
					src: `/fs/apps/anura/${app.name}/${appData.index}`,
					size: {
						width: appData.wininfo.width,
						height: appData.wininfo.height,
					},
					single: appData.wininfo.allowMultipleInstance,
				});
				window.parent.anura.apps[appData.package] = {
					title: appData.name,
					icon: appData.icon,
					id: appData.package,
				};
				await window.parent.tb.fs.promises.unlink(`${APath}.zip`);
				try {
					let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
					apps.push({
						name: appData.name,
						user: await window.parent.tb.user.username(),
						config: `/apps/anura/${aName}/manifest.json`,
					});
					await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
				} catch {
					await window.parent.tb.fs.promises.writeFile(
						`/apps/installed.json`,
						JSON.stringify([
							{
								name: appData.name,
								user: await window.parent.tb.user.username(),
								config: `/apps/anura/${aName}/manifest.json`,
							},
						]),
					);
				}
			} catch (e) {
				displayError(`Failed to install ${aName} with reason: ${e.message}`);
				return;
			}
			break;
	}
}

async function unzip(path, target) {
	const response = await fetch("/fs/" + path);
	const zipFileContent = await response.arrayBuffer();
	if (!(await dirExists(target))) {
		await window.parent.tb.fs.promises.mkdir(target, { recursive: true });
	}
	const compressedFiles = window.parent.tb.fflate.unzipSync(new Uint8Array(zipFileContent));
	for (const [relativePath, content] of Object.entries(compressedFiles)) {
		const fullPath = `${target}/${relativePath}`;
		const pathParts = fullPath.split("/");
		let currentPath = "";
		for (let i = 0; i < pathParts.length; i++) {
			currentPath += pathParts[i] + "/";
			if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
				try {
					console.log(`touch ${currentPath.slice(0, -1)}`);
					displayOutput(`touch ${currentPath.slice(0, -1)}`);
					await window.parent.tb.fs.promises.writeFile(currentPath.slice(0, -1), Filer.Buffer.from(content));
				} catch {
					displayOutput(`Cant make ${currentPath.slice(0, -1)}`);
					console.log(`Cant make ${currentPath.slice(0, -1)}`);
				}
			} else if (!(await dirExists(currentPath))) {
				try {
					console.log(`mkdir ${currentPath}`);
					displayOutput(`mkdir ${currentPath}`);
					await window.parent.tb.fs.promises.mkdir(currentPath);
				} catch {
					console.log(`Cant make ${currentPath}`);
					displayOutput(`Cant make ${currentPath}`);
				}
			}
		}
		if (relativePath.endsWith("/")) {
			try {
				console.log(`mkdir fp ${fullPath}`);
				await window.parent.tb.fs.promises.mkdir(fullPath);
			} catch {
				console.log(`Cant make ${fullPath}`);
			}
		}
	}
	return "Done!";
}

const dirExists = async path => {
	return new Promise(resolve => {
		window.parent.tb.fs.stat(path, (err, stats) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);
				} else {
					console.error(err);
					resolve(false);
				}
			} else {
				const exists = stats.type === "DIRECTORY";
				resolve(exists);
			}
		});
	});
};

/**
 * Compares two semantic version strings.
 * @param {string} a - The first version string.
 * @param {string} b - The second version string.
 * @returns {number} - Returns 1 if a > b, -1 if a < b, 0 if they are equal.
 */
const semverCompare = (a, b) => {
	const pa = a.split(/[-.]/);
	const pb = b.split(/[-.]/);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const na = pa[i] || "0";
		const nb = pb[i] || "0";
		if (!isNaN(na) && !isNaN(nb)) {
			if (+na > +nb) return 1;
			if (+na < +nb) return -1;
		} else {
			if (na > nb) return 1;
			if (na < nb) return -1;
		}
	}
	return 0;
};

pkg(args);

import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";
import { Buffer as BrowserBuffer } from "buffer/";
import git, { type GitAuth, type GitHttpRequest, type GitHttpResponse } from "isomorphic-git";

if (typeof globalThis.Buffer === "undefined") {
	Object.defineProperty(globalThis, "Buffer", { configurable: true, value: BrowserBuffer });
}

type GitDialog = {
	WebAuth(props: { title: string; onOk: (username: string, password: string) => void; onCancel?: () => void }): void;
};

type GitRuntime = {
	fs: typeof window.tb.fs;
	user: { username(): Promise<string> };
	libcurl: { fetch(url: string, options?: RequestInit): Promise<Response> };
	dialog?: GitDialog;
	system: { openApp(pkg: string): Promise<void> };
};

const HELP = `${[
	"usage: git [--version] [--help] <command> [<args>]",
	"",
	"Start a working area:",
	"  clone <repository> [directory]    Clone a repository",
	"  init [directory]                   Create an empty repository",
	"",
	"Work on the current change:",
	"  add <file> [directory]             Add file contents to the index",
	"  rm <file> [directory]              Remove file from working tree and index",
	"  commit -m <message>                Record staged changes",
	"  checkout <branch> [directory]      Switch branches",
	"  status [directory]                 Show working tree status",
	"",
	"Collaborate:",
	"  fetch [remote] [directory]          Download objects and refs",
	"  pull [remote] [branch] [directory] Fetch and integrate changes",
	"  push [remote] [branch] [directory] Update remote refs",
	"",
	"  gui                                Open GitGUI",
].join("\n")}\n`;

const api = (): GitRuntime => {
	const runtime = (globalThis as typeof globalThis & { window?: { tb?: GitRuntime } }).window?.tb;
	if (!runtime) throw new Error("Terbium API is unavailable (git must run inside TerbiumOS)");
	return runtime;
};

const normalize = (path: string): string => {
	const parts: string[] = [];
	for (const part of path.replaceAll("\\", "/").split("/")) {
		if (!part || part === ".") continue;
		if (part === "..") parts.pop();
		else parts.push(part);
	}
	return `/${parts.join("/")}` || "/";
};

const join = (...parts: string[]): string => normalize(parts.join("/"));
const basename = (path: string): string => normalize(path).split("/").filter(Boolean).at(-1) ?? "repository";
const dirname = (path: string): string => {
	const normalized = normalize(path);
	const index = normalized.lastIndexOf("/");
	return index <= 0 ? "/" : normalized.slice(0, index);
};

const homePath = (context: HostBinaryContext): string => normalize(context.env.HOME || `/home/${context.env.USER || "terbium"}`);
const resolvePath = (raw: string | undefined, cwd: string, home: string): string => {
	if (!raw || raw === ".") return normalize(cwd);
	if (raw === "~") return home;
	if (raw.startsWith("~/")) return join(home, raw.slice(2));
	return raw.startsWith("/") ? normalize(raw) : join(cwd, raw);
};

const authCallback =
	(runtime: GitRuntime, preset?: GitAuth) =>
	async (_url: string, auth: GitAuth): Promise<GitAuth> => {
		if (preset?.username || preset?.password || preset?.headers) return { ...auth, ...preset };
		const showAuth = runtime.dialog?.WebAuth;
		if (!showAuth) throw new Error("Authentication required; no Terbium authentication dialog is available");
		return new Promise((resolve, reject) => {
			showAuth({
				title: "Git authentication",
				onOk: (username, password) => resolve({ ...auth, username, password }),
				onCancel: () => reject(new Error("Authentication was canceled")),
			});
		});
	};

const httpAdapter = (runtime: GitRuntime) => ({
	request: async (request: GitHttpRequest): Promise<GitHttpResponse> => {
		const headers = new Headers(request.headers);
		let body: BodyInit | undefined;
		if (request.body) {
			const chunks: Uint8Array[] = [];
			for await (const chunk of request.body) chunks.push(chunk);
			const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) {
				bytes.set(chunk, offset);
				offset += chunk.byteLength;
			}
			body = bytes;
		}
		const response = await runtime.libcurl.fetch(request.url, {
			method: request.method ?? "GET",
			headers,
			body,
			redirect: "follow",
		});
		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});
		return {
			url: response.url || request.url,
			method: request.method,
			headers: responseHeaders,
			body: (async function* () {
				yield new Uint8Array(await response.arrayBuffer());
			})(),
			statusCode: response.status,
			statusMessage: response.statusText,
		};
	},
});

const repoOptions = (runtime: GitRuntime, dir: string, auth?: GitAuth) => ({
	fs: window.tb.fs,
	dir,
	...(auth ? { onAuth: authCallback(runtime, auth) } : {}),
});

const statusText = async (runtime: GitRuntime, dir: string): Promise<string> => {
	const statuses = await git.statusMatrix(repoOptions(runtime, dir));
	if (!statuses.length) return `On branch ${await currentBranch(runtime, dir)}\n\nnothing to commit, working tree clean\n`;
	const lines = [`On branch ${await currentBranch(runtime, dir)}`, ""];
	const staged: string[] = [];
	const unstaged: string[] = [];
	const untracked: string[] = [];
	for (const [filepath, head, workdir, stage] of statuses) {
		if (head === 0 && workdir === 2 && stage === 0) untracked.push(filepath);
		else if (head !== stage) staged.push(`${stage === 0 ? "deleted" : head === 0 ? "new file" : "modified"}: ${filepath}`);
		if (head !== 0 && workdir !== head) unstaged.push(`${workdir === 0 ? "deleted" : "modified"}: ${filepath}`);
	}
	if (staged.length) lines.push("Changes to be committed:", ...staged.map(line => `  ${line}`), "");
	if (unstaged.length) lines.push("Changes not staged for commit:", ...unstaged.map(line => `  ${line}`), "");
	if (untracked.length) lines.push("Untracked files:", ...untracked.map(file => `  ${file}`), "");
	if (!staged.length && !unstaged.length && !untracked.length) lines.push("nothing to commit, working tree clean");
	return `${lines.join("\n")}\n`;
};

const currentBranch = async (runtime: GitRuntime, dir: string): Promise<string> => {
	try {
		return (await git.currentBranch(repoOptions(runtime, dir))) ?? "HEAD (detached)";
	} catch {
		return "HEAD";
	}
};

const requireArg = (value: string | undefined, usage: string): string => {
	if (!value) throw new Error(`Usage: ${usage}`);
	return value;
};

const repoDirectory = (args: string[], cwd: string, home: string): { dir: string; values: string[] } => {
	const directoryIndex = args.findIndex(value => value.startsWith("--directory="));
	if (directoryIndex !== -1) {
		const option = args[directoryIndex];
		if (!option) return { dir: cwd, values: args };
		const dir = resolvePath(option.slice("--directory=".length), cwd, home);
		return { dir, values: args.filter((_, index) => index !== directoryIndex) };
	}
	const directoryFlag = args.findIndex(value => value === "-C" || value === "--directory");
	if (directoryFlag !== -1) {
		const dir = resolvePath(args[directoryFlag + 1], cwd, home);
		return { dir, values: args.filter((_, index) => index !== directoryFlag && index !== directoryFlag + 1) };
	}
	return { dir: cwd, values: args };
};

const output = (status = 0, stdout = ""): HostBinaryResult => ({ status, stdout });

const errorMessage = (error: unknown): string => {
	if (typeof error === "string") return error;
	if (!error || typeof error !== "object") return String(error);
	const detail = error as { message?: unknown; code?: unknown; data?: unknown; caller?: unknown };
	const parts: string[] = [];
	if (typeof detail.message === "string" && detail.message.length) parts.push(detail.message);
	if (typeof detail.code === "string" && detail.code.length) parts.push(`[${detail.code}]`);
	if (typeof detail.caller === "string" && detail.caller.length) parts.push(`in ${detail.caller}`);
	if (detail.data !== undefined && detail.data !== null) {
		const data = typeof detail.data === "string" ? detail.data : JSON.stringify(detail.data);
		if (data) parts.push(data);
	}
	return parts.join(" ") || Object.prototype.toString.call(error);
};

const run = async ({ args, cwd, env }: HostBinaryContext): Promise<HostBinaryResult> => {
	const runtime = api();
	const command = args[0] ?? "help";
	const rest = args.slice(1);
	const home = homePath({ args, cwd, env });
	const workdir = resolvePath(cwd, "/", home);
	const messages: string[] = [];
	const message = (text: string): void => {
		messages.push(text);
	};
	const outputWithMessages = (status: number, stdout = ""): HostBinaryResult => ({ status, stdout: `${messages.length ? `${messages.join("\n")}\n` : ""}${stdout}` });
	try {
		if (command === "--version" || command === "version") return output(0, `git version ${git.version()}\n`);
		if (command === "--help" || command === "-h" || command === "help") return output(0, HELP);
		if (command === "gui") {
			await runtime.system.openApp("com.tb.gitgui");
			return output(0, "Opening GitGUI app...\n");
		}
		if (command === "clone") {
			const url = requireArg(rest[0], "git clone <repository> [directory]");
			const target = resolvePath(rest[1] ?? basename(url.replace(/\.git$/, "")), workdir, home);
			if (await window.tb.fs.promises.exists(target)) throw new Error(`destination path '${target}' already exists`);
			await window.tb.fs.promises.mkdir(dirname(target));
			message(`Cloning into '${basename(target)}'...`);
			const auth = authCallback(runtime);
			const http = httpAdapter(runtime);
			await git.clone({
				fs: window.tb.fs,
				http,
				dir: target,
				url,
				singleBranch: true,
				depth: 1,
				onAuth: auth,
				onMessage: message,
			});
			const username = await runtime.user.username();
			await git.setConfig({ ...repoOptions(runtime, target), path: "user.name", value: username });
			await git.setConfig({ ...repoOptions(runtime, target), path: "user.email", value: `${username}@terbiumon.top` });
			return outputWithMessages(0, `Cloned ${url} into ${target}\n`);
		}
		if (command === "init") {
			const target = resolvePath(rest[0] ?? ".", workdir, home);
			await window.tb.fs.promises.mkdir(target);
			await git.init({ ...repoOptions(runtime, target), defaultBranch: "master" });
			return output(0, `Initialized empty Git repository in ${join(target, ".git")}/\n`);
		}
		if (command === "remote") {
			const action = rest[0];
			const dir = resolvePath(rest.find(value => value.startsWith("/")) ?? ".", workdir, home);
			if (action === "add") {
				const remoteName = requireArg(rest[1], "git remote add <name> <url>");
				const url = requireArg(rest[2], "git remote add <name> <url>");
				await git.addRemote(repoOptions(runtime, dir), { remote: remoteName, url });
				return output(0, "");
			}
			if (!action || action === "-v" || action === "--verbose") {
				const remotes = await git.listRemotes(repoOptions(runtime, dir));
				return output(0, remotes.map(remote => `${remote.remote}\t${remote.url} (fetch)\n${remote.remote}\t${remote.url} (push)`).join("\n") + (remotes.length ? "\n" : ""));
			}
			throw new Error("Usage: git remote [-v] | git remote add <name> <url>");
		}
		if (command === "status") return output(0, await statusText(runtime, resolvePath(rest[0] ?? ".", workdir, home)));
		if (command === "add") {
			const { dir, values } = repoDirectory(rest, workdir, home);
			if (!values.length) throw new Error("Nothing specified, nothing added.");
			for (const file of values) await git.add(repoOptions(runtime, dir), { filepath: file });
			return output(0, `Added ${values.map(file => `'${file}'`).join(" ")} to staging area\n`);
		}
		if (command === "rm") {
			const { dir, values } = repoDirectory(rest, workdir, home);
			if (!values.length) throw new Error("Usage: git rm <file>...");
			for (const file of values) await git.remove(repoOptions(runtime, dir), { filepath: file });
			return output(0, `Removed ${values.map(file => `'${file}'`).join(" ")} from the working tree and index\n`);
		}
		if (command === "commit") {
			let commitMessage: string | undefined;
			for (let i = 0; i < rest.length; i++) {
				if (rest[i] === "-m" || rest[i] === "--message") commitMessage = rest[++i];
				else if (rest[i] && !rest[i].startsWith("-")) commitMessage = rest[i];
			}
			commitMessage = requireArg(commitMessage, "git commit -m <message>");
			const username = await runtime.user.username();
			const oid = await git.commit({
				...repoOptions(runtime, workdir),
				author: { name: username, email: `${username}@terbiumon.top` },
				committer: { name: username, email: `${username}@terbiumon.top` },
				message: commitMessage,
			});
			return output(0, `[${await currentBranch(runtime, workdir)} ${oid.slice(0, 7)}] ${commitMessage}\n`);
		}
		if (command === "checkout" || command === "switch") {
			const branch = requireArg(rest[0], "git checkout <branch>");
			const target = resolvePath(rest[1] ?? ".", workdir, home);
			await git.checkout({ ...repoOptions(runtime, target), ref: branch, onMessage: message });
			return output(0, `Switched to branch '${branch}'\n`);
		}
		if (command === "fetch") {
			const remote = rest[0] && !rest[0].startsWith("-") ? rest[0] : "origin";
			const target = resolvePath(rest.find(value => value.startsWith("/")) ?? ".", workdir, home);
			const url = await git.getConfig({ ...repoOptions(runtime, target), path: `remote.${remote}.url` });
			if (!url) throw new Error(`'${remote}' does not appear to be a git repository`);
			await git.fetch({ ...repoOptions(runtime, target), http: httpAdapter(runtime), remote, onAuth: authCallback(runtime), onMessage: message, tags: rest.includes("--tags") });
			return output(0, `Fetch successful from ${remote} (${url})\n`);
		}
		if (command === "pull") {
			const remote = rest[0] && !rest[0].startsWith("-") ? rest[0] : "origin";
			const branch = rest[1] && !rest[1].startsWith("/") && !rest[1].startsWith("-") ? rest[1] : undefined;
			const target = resolvePath(rest.find(value => value.startsWith("/")) ?? ".", workdir, home);
			const username = await runtime.user.username();
			const result = await git.pull({
				...repoOptions(runtime, target),
				http: httpAdapter(runtime),
				remote,
				...(branch ? { ref: branch } : {}),
				author: { name: username, email: `${username}@terbiumon.top` },
				onAuth: authCallback(runtime),
				onMessage: message,
			});
			return output(0, result.alreadyUpToDate ? "Already up to date.\n" : "Pull successful.\n");
		}
		if (command === "push") {
			const remote = rest[0] && !rest[0].startsWith("-") ? rest[0] : "origin";
			const branch = rest[1] && !rest[1].startsWith("/") && !rest[1].startsWith("-") ? rest[1] : undefined;
			const target = resolvePath(rest.find(value => value.startsWith("/")) ?? ".", workdir, home);
			const result = await git.push({
				...repoOptions(runtime, target),
				http: httpAdapter(runtime),
				remote,
				...(branch ? { ref: branch } : {}),
				onAuth: authCallback(runtime),
				onMessage: message,
			});
			return output(0, result.ok ? `Pushed to ${remote}.\n` : `Push to ${remote} completed with errors.\n`);
		}
		if (command === "log") {
			const commits = await git.log({ ...repoOptions(runtime, workdir), depth: 20 });
			return output(0, commits.map(entry => `commit ${entry.oid}\nAuthor: ${entry.commit.author.name} <${entry.commit.author.email}>\nDate:   ${new Date(entry.commit.author.timestamp * 1000).toISOString()}\n\n    ${entry.commit.message.trim()}\n`).join("\n"));
		}
		if (command === "branch") {
			const branches = await git.listBranches(repoOptions(runtime, workdir));
			const current = await currentBranch(runtime, workdir);
			return output(0, `${branches.map(branch => `${branch === current ? "*" : " "} ${branch}`).join("\n")}\n`);
		}
		return { status: 2, stderr: `git: '${command}' is not a git command. See 'git --help'.\n` };
	} catch (error) {
		return {
			status: 1,
			stdout: messages.length ? `${messages.join("\n")}\n` : undefined,
			stderr: `fatal: ${errorMessage(error)}\n`,
		};
	}
};

export const gitBinary: HostBinary = run;
export default gitBinary;

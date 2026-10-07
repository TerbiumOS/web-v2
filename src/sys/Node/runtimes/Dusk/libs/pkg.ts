import type { HostBinary, HostBinaryContext, HostBinaryResult } from "@nightnetwork/dusk";

const HELP =
	[
		"TPKG 2.0.0",
		"Usage: pkg <command>",
		"",
		"  install <name>  Download and install a package",
		"  remove <name>   Remove an installed package record",
		"  update <name>   Update an installed TAPP package",
		"  list            List installed packages",
		"  search <term>   Search the configured repository",
		"  repo list       List configured repositories",
		"  repo set <url>  Select a repository",
		"  repo add <url>  Add a repository",
		"  repo remove <url> Remove a repository",
		"",
		"Package installation is limited to filesystem-backed packages in Dusk.",
	].join("\n") + "\n";

const run: HostBinary = async ({ args }: HostBinaryContext): Promise<HostBinaryResult> => {
	const command = args[0] ?? "help";
	if (command === "help" || command === "-h" || command === "--help") return { status: 0, stdout: HELP };
	if (command === "list") return { status: 0, stdout: "Dusk package listing is not available until the TFS package index is configured.\n" };
	if (command === "search") return { status: 1, stderr: "pkg: repository access requires a configured Dusk package bridge\n" };
	if (command === "repo") return { status: 0, stdout: "pkg: repository configuration is managed by Dusk extensions\n" };
	if (["install", "remove", "update"].includes(command)) {
		return { status: 1, stderr: `pkg: ${command} is not yet enabled for host execution\n` };
	}
	return { status: 2, stderr: `pkg: unknown command '${command}'\n` };
};

export const pkg: HostBinary = run;
export default pkg;

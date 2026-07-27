import type { BootReplResult, DuskProcessHandle, SpawnOptions, ProcessManager } from "@nightnetwork/dusk";

export type { BootReplResult, DuskProcessHandle, SpawnOptions, ProcessManager };

export interface TerbiumDuskAPI {
	runtime: BootReplResult | null;
	processManager: ProcessManager | null;
	isReady: boolean;
	servers: Map<number, string>;

	start(): Promise<void>;
	stop(): Promise<boolean>;
	spawn(cmd: string, args?: string[], options?: SpawnOptions): Promise<DuskProcessHandle>;
	spawnSync(cmd: string, args?: string[], options?: SpawnOptions): Promise<{ stdout: Uint8Array; stderr: Uint8Array; status: number }>;
	feed(line: string): Promise<void>;

	node: {
		spawn(args?: string[], options?: SpawnOptions): Promise<DuskProcessHandle>;
	};
	shell: {
		spawn(command?: string, options?: SpawnOptions): Promise<DuskProcessHandle>;
	};
	python: {
		spawn(script?: string, options?: SpawnOptions): Promise<DuskProcessHandle>;
	};
	sqlite: {
		spawn(database?: string, options?: SpawnOptions): Promise<DuskProcessHandle>;
	};

	resizePty(pid: number, cols: number, rows: number): void;
	killProcess(pid: number): void;
	listProcesses(): number[];
}

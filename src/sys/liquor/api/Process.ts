export class Processes {
	processesDiv: HTMLDivElement | null;
	constructor() {
		this.processesDiv = document.querySelector("window-area");
	}
	get procs() {
		const tbProcs = window.tb.process.list();
		const arr: WeakRef<any>[] = [];
		for (const [pid, proc] of Object.entries(tbProcs)) {
			const procObj = {
				pid: Number(pid),
				title: proc.name,
				kill() {
					window.tb.process.kill(pid);
				},
				get alive() {
					return window.tb.process.list()[Number(pid)] != null;
				},
				...proc,
			};
			arr.push(new WeakRef(procObj));
		}
		const s1 = Symbol();
		const s2 = Symbol();
		(arr as any)[s1] = [];
		(arr as any)[s2] = Array.from(arr);
		return new Proxy(arr, {});
	}

	set procs(value) {
		console.log(`API Stub, ${value} will not be used`);
		window.tb.process.create();
	}

	remove(pid: number) {
		window.tb.process.kill(String(pid));
	}

	register(proc: Process) {
		console.log(`API Stub, ${proc} will not be used`);
		window.tb.process.create();
	}

	create(proc: any) {
		console.log(`API Stub, ${proc} will not be used`);
		window.tb.process.create();
	}
}

abstract class Process {
	abstract pid: number;
	abstract title: string;
	// @ts-expect-error
	stdout: ReadableStream<Uint8Array>;
	// @ts-expect-error
	stderr: ReadableStream<Uint8Array>;
	// @ts-expect-error
	stdin: WritableStream<Uint8Array>;

	kill() {
		window.tb.process.kill(String(this.pid));
	}
	abstract get alive(): boolean;
}

export class Processes {
	processesDiv: HTMLDivElement | null;
	constructor() {
		this.processesDiv = document.querySelector("window-area");
	}
	get procs() {
		const wins = window.anura.wm.windows;
		const arr: WeakRef<any>[] = wins.reduce((out: WeakRef<any>[], w: any) => {
			if (!w) return out;
			out.push(typeof w?.deref === "function" ? (w as WeakRef<any>) : new WeakRef(w));
			return out;
		}, []);
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

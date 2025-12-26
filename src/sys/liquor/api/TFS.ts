// @ts-nocheck
import { AFSProvider } from "./Filesystem";
const AnuraFDSymbol = Symbol.for("AnuraFD");
import { FSType } from "@terbiumos/tfs";
type AnuraFD = {
	fd: number;
	[AnuraFDSymbol]: string;
};

export class TFSProvider extends AFSProvider<any> {
	domain = "/";
	name = "TFS Anura Provider";
	version = window.tfs.version;

	fs: FSType;

	constructor(fs: FSType) {
		super();
		this.fs = fs;
	}

	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(oldPath);
		fs.rename(oldPath, newPath, callback);
	}

	ftruncate(fd: AnuraFD, len: number, callback?: (err: Error | null, fd: AnuraFD) => void) {
		throw new Error("Method not implemented.");
	}

	truncate(path: string, len: number, callback?: (err: Error | null) => void) {
		throw new Error("Method not implemented.");
	}

	stat(path: string, callback?: (err: Error | null, stats: any) => void) {
		const fs = window.tb.vfs.whatFS(path);
		fs.stat(path, callback);
	}

	fstat(fd: AnuraFD, callback?: ((err: Error | null, stats: any) => void) | undefined): void {
		throw new Error("Method not implemented.");
	}

	lstat(path: string, callback?: (err: Error | null, stats: any) => void) {
		const fs = window.tb.vfs.whatFS(path);
		fs.lstat(path, callback);
	}

	exists(path: string, callback?: (exists: boolean) => void) {
		const fs = window.tb.vfs.whatFS(path);
		this.fs.exists(path, callback);
	}

	link(srcPath: string, dstPath: string, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(srcPath);
		if (!fs.link) throw new Error("Linking not supported on this filesystem.");
		fs.link(srcPath, dstPath, callback);
	}

	symlink(path: string, callback?: (err: Error | null) => void, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.symlink) throw new Error("Symlinking not supported on this filesystem.");
		// @ts-expect-error - Overloaded methods are scary
		fs.symlink(path, callback, ...rest);
	}

	readlink(path: string, callback?: (err: Error | null, linkContents: string) => void) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.readlink) throw new Error("Reading links not supported on this filesystem.");
		fs.readlink(path, callback);
	}

	unlink(path: string, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.unlink) throw new Error("Unlinking not supported on this filesystem.");
		fs.unlink(path, callback);
	}

	mknod(path: string, mode: number, callback?: (err: Error | null) => void) {
		throw new Error("Method not implemented.");
	}

	rmdir(path: string, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(path);
		fs.rmdir(path, callback);
	}

	mkdir(path: string, callback?: (err: Error | null) => void, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		fs.mkdir(path, callback, ...rest);
	}

	access(path: string, callback?: (err: Error | null) => void, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		fs.access(path, callback, ...rest);
	}

	mkdtemp(...args: any[]) {
		window.tfs.shell.tempDir(...args);
	}

	readdir(path: string, callback?: (err: Error | null, files?: string[] | any[]) => void, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		fs.readdir(path, callback, ...rest);
	}

	close(fd: AnuraFD, callback?: ((err: Error | null) => void) | undefined): void {
		throw new Error("Method not implemented.");
	}

	open(path: string, flags: "r" | "r+" | "w" | "w+" | "a" | "a+", mode: number, callback?: ((err: Error | null, fd: AnuraFD) => void) | undefined): void;
	open(path: string, flags: "r" | "r+" | "w" | "w+" | "a" | "a+", callback?: ((err: Error | null, fd: AnuraFD) => void) | undefined): void;
	open(path: string, flags: "r" | "r+" | "w" | "w+" | "a" | "a+", mode?: unknown, callback?: unknown): void {
		throw new Error("Method not implemented.");
	}

	utimes(path: string, atime: number | Date, mtime: number | Date, callback?: (err: Error | null) => void) {
		throw new Error("Method not implemented.");
	}

	futimes(fd: AnuraFD, ...rest: any[]) {
		throw new Error("Method not implemented.");
	}

	chown(path: string, uid: number, gid: number, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.chown) throw new Error("Chowning not supported on this filesystem.");
		fs.chown(path, uid, gid, callback);
	}

	fchown(fd: AnuraFD, ...rest: any[]) {
		throw new Error("Method not implemented.");
	}

	chmod(path: string, mode: number, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.chmod) throw new Error("Chmod not supported on this filesystem.");
		fs.chmod(path, mode, callback);
	}

	fchmod(fd: AnuraFD, ...rest: any[]) {
		throw new Error("Method not implemented.");
	}

	fsync(fd: AnuraFD, ...rest: any[]) {
		// @ts-expect-error - Overloaded methods are scary
		this.fs.fsync(fd.fd, ...rest);
	}

	write(fd: AnuraFD, ...rest: any[]) {
		// @ts-expect-error - Overloaded methods are scary
		this.fs.write(fd.fd, ...rest);
	}

	read(fd: AnuraFD, ...rest: any[]) {
		// @ts-expect-error - Overloaded methods are scary
		this.fs.read(fd.fd, ...rest);
	}

	readFile(path: string, callback?: (err: Error | null, data: Uint8Array) => void) {
		const fs = window.tb.vfs.whatFS(path);
		fs.readFile(path, callback);
	}

	writeFile(path: string, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		// @ts-expect-error - Overloaded methods are scary
		fs.writeFile(path, ...rest);
	}

	appendFile(path: string, data: Uint8Array, callback?: (err: Error | null) => void) {
		const fs = window.tb.vfs.whatFS(path);
		fs.appendFile(path, data, callback);
	}

	setxattr(path: string, ...rest: any[]) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.setxattr) throw new Error("Extended attributes not supported on this filesystem.");
		fs.setxattr(path, ...rest);
	}

	fsetxattr(fd: AnuraFD, ...rest: any[]) {
		throw new Error("Method not implemented.");
	}

	getxattr(path: string, name: string, callback?: (err: Error | null, value: string | object) => void) {
		const fs = window.tb.vfs.whatFS(path);
		if (!fs.getxattr) throw new Error("Extended attributes not supported on this filesystem.");
		fs.getxattr(path, name, callback);
	}

	fgetxattr(fd: AnuraFD, name: string, callback?: (err: Error | null, value: string | object) => void) {
		throw new Error("Method not implemented.");
	}

	removexattr(path: string, name: string, callback?: (err: Error | null) => void) {
		throw new Error("Method not implemented.");
	}

	fremovexattr(fd: AnuraFD, ...rest: any[]) {
		throw new Error("Method not implemented.");
	}

	promises = {
		appendFile: (path: string, data: Uint8Array, options: { encoding: string; mode: number; flag: string }) => {
			return new Promise<void>((resolve, reject) => {
				this.appendFile(path, data, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		access: (path: string, mode?: number) => {
			return new Promise<void>((resolve, reject) => {
				this.access(path, mode, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		chown: (path: string, uid: number, gid: number) => {
			return new Promise<void>((resolve, reject) => {
				this.chown(path, uid, gid, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		chmod: (path: string, mode: number) => {
			return new Promise<void>((resolve, reject) => {
				this.chmod(path, mode, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		getxattr: (path: string, name: string) => {
			return new Promise<string | object>((resolve, reject) => {
				this.getxattr(path, name, (err: Error | null, value: string | object) => {
					if (err) reject(err);
					else resolve(value);
				});
			});
		},
		link: (srcPath: string, dstPath: string) => {
			return new Promise<void>((resolve, reject) => {
				this.link(srcPath, dstPath, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		lstat: (path: string) => {
			return new Promise<any>((resolve, reject) => {
				this.lstat(path, (err: Error | null, stats: any) => {
					if (err) reject(err);
					else resolve(stats);
				});
			});
		},
		mkdir: (path: string, mode?: number) => {
			return new Promise<void>((resolve, reject) => {
				this.mkdir(path, mode, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		mkdtemp: (prefix: string, options?: { encoding: string }) => {
			return new Promise<string>((resolve, reject) => {
				this.mkdtemp(prefix, options, (err: Error | null, folder: string) => {
					if (err) reject(err);
					else resolve(folder);
				});
			});
		},
		mknod: (path: string, mode: number) => {
			return new Promise<void>((resolve, reject) => {
				this.mknod(path, mode, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		open: async (path: string, flags: "r" | "r+" | "w" | "w+" | "a" | "a+", mode?: number) => ({
			fd: await new Promise<number>((resolve, reject) => {
				this.open(path, flags, mode as any, (err: Error | null, fd: AnuraFD) => {
					if (err) reject(err);
					else resolve(fd.fd);
				});
			}),
			[AnuraFDSymbol]: this.domain,
		}),
		readdir: (path: string, options?: { encoding: string; withFileTypes: boolean }) => {
			return new Promise<string[] | any[]>((resolve, reject) => {
				this.readdir(path, (err: Error | null, files: string[] | any[]) => {
					if (err) reject(err);
					else resolve(files);
				});
			});
		},
		readFile: (path: string) => {
			return new Promise<Uint8Array>((resolve, reject) => {
				this.readFile(path, (err: Error | null, data: Uint8Array) => {
					if (err) reject(err);
					else resolve(data);
				});
			});
		},
		readlink: (path: string) => {
			return new Promise<string>((resolve, reject) => {
				this.readlink(path, (err: Error | null, linkString: string) => {
					if (err) reject(err);
					else resolve(linkString);
				});
			});
		},
		removexattr: (path: string, name: string) => {
			return new Promise<void>((resolve, reject) => {
				this.removexattr(path, name, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		rename: (oldPath: string, newPath: string) => {
			return new Promise<void>((resolve, reject) => {
				this.rename(oldPath, newPath, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		rmdir: (path: string) => {
			return new Promise<void>((resolve, reject) => {
				this.rmdir(path, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		setxattr: (path: string, name: string, value: string | object, flag?: "CREATE" | "REPLACE") => {
			return new Promise<void>((resolve, reject) => {
				this.setxattr(path, name, value, flag, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		stat: (path: string) => {
			return new Promise<any>((resolve, reject) => {
				this.stat(path, (err: Error | null, stats: any) => {
					if (err) reject(err);
					else resolve(stats);
				});
			});
		},
		symlink: (srcPath: string, dstPath: string, type?: string) => {
			return new Promise<void>((resolve, reject) => {
				this.symlink(srcPath, dstPath, type, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		truncate: (path: string, len: number) => {
			return new Promise<void>((resolve, reject) => {
				this.truncate(path, len, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},

		unlink: (path: string) => {
			return new Promise<void>((resolve, reject) => {
				this.unlink(path, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		utimes: (path: string, atime: number | Date, mtime: number | Date) => {
			return new Promise<void>((resolve, reject) => {
				this.utimes(path, atime, mtime, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
		writeFile: (path: string, data: Uint8Array | string, options: { encoding: string; mode: number; flag: string }) => {
			return new Promise<void>((resolve, reject) => {
				this.writeFile(path, data, options, (err: Error | null) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
	};
}

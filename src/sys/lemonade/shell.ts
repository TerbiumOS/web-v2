export class Shell {
	async openExternal(url: string, options?: { activate?: boolean }): Promise<void> {
		console.log(`Opening external URL: ${url}`, options);
		window.open(url, "_blank");
	}

	async openPath(path: string) {
		console.log(`Opening path: ${path}`);
		window.tb.system.openApp("Files")
	}

	showItemInFolder(fullPath: string): void {
		console.log(`Showing item in folder: ${fullPath}`);
		const lastSlash = fullPath.lastIndexOf("/");
		const directory = lastSlash > 0 ? fullPath.substring(0, lastSlash) : "/";
		this.openPath(directory);
	}

	async moveItemToTrash(fullPath: string): Promise<boolean> {
		console.log(`Moving item to trash: ${fullPath}`);
		try {
			const trashPath = `/system/trash`;
			const fileName = fullPath.substring(fullPath.lastIndexOf("/") + 1);
			const destPath = `${trashPath}/${fileName}`;
			try {
				await window.tb.fs.promises.mkdir(trashPath);
			} catch {}			
			await window.tb.fs.promises.rename(fullPath, destPath);
			return true;
		} catch (error) {
			console.error("Failed to move item to trash:", error);
			return false;
		}
	}

	async trashItem(path: string): Promise<void> {
		await this.moveItemToTrash(path);
	}

	beep(): void {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		oscillator.frequency.value = 800;
		oscillator.type = "sine";
		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.1);
	}

	writeShortcutLink(shortcutPath: string, operation: string, options: any): boolean {
		console.log(`Writing shortcut link: ${shortcutPath}`, operation, options);
		return false;
	}

	readShortcutLink(shortcutPath: string): any {
		console.log(`Reading shortcut link: ${shortcutPath}`);
		return null;
	}
}

export const shell = new Shell();

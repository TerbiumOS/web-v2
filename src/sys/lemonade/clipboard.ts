export class Clipboard {
	async readText(_type?: "selection" | "clipboard"): Promise<string> {
		try {
			return await navigator.clipboard.readText();
		} catch (error) {
			console.error("Failed to read clipboard:", error);
			return "";
		}
	}

	async writeText(text: string, _type?: "selection" | "clipboard"): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
		} catch (error) {
			console.error("Failed to write to clipboard:", error);
		}
	}

	async readHTML(_type?: "selection" | "clipboard"): Promise<string> {
		try {
			const items = await navigator.clipboard.read();
			for (const item of items) {
				if (item.types.includes("text/html")) {
					const blob = await item.getType("text/html");
					return await blob.text();
				}
			}
			return "";
		} catch (error) {
			console.error("Failed to read HTML from clipboard:", error);
			return "";
		}
	}

	async writeHTML(markup: string, _type?: "selection" | "clipboard"): Promise<void> {
		try {
			const blob = new Blob([markup], { type: "text/html" });
			await navigator.clipboard.write([
				new ClipboardItem({
					"text/html": blob,
				}),
			]);
		} catch (error) {
			console.error("Failed to write HTML to clipboard:", error);
		}
	}

	async readImage(_type?: "selection" | "clipboard"): Promise<any> {
		try {
			const items = await navigator.clipboard.read();
			for (const item of items) {
				for (const mimeType of item.types) {
					if (mimeType.startsWith("image/")) {
						return await item.getType(mimeType);
					}
				}
			}
			return null;
		} catch (error) {
			console.error("Failed to read image from clipboard:", error);
			return null;
		}
	}

	async writeImage(image: any, _type?: "selection" | "clipboard"): Promise<void> {
		console.log("writeImage not fully implemented", image);
		// Would need proper image handling
	}

	clear(_type?: "selection" | "clipboard"): void {
		this.writeText("");
	}

	availableFormats(_type?: "selection" | "clipboard"): string[] {
		console.log("availableFormats called - limited in web environment");
		return [];
	}

	has(format: string, _type?: "selection" | "clipboard"): boolean {
		console.log(`has(${format}) called - limited in web environment`);
		return false;
	}

	read(format: string): string {
		console.log(`read(${format}) called - limited in web environment`);
		return "";
	}

	write(data: any, type?: "selection" | "clipboard"): void {
		console.log("write called with data:", data, type);
		if (data.text) {
			this.writeText(data.text, type);
		}
		if (data.html) {
			this.writeHTML(data.html, type);
		}
	}

	readFindText(): string {
		return "";
	}

	writeFindText(text: string): void {
		console.log("writeFindText:", text);
	}

	readBookmark(): { title: string; url: string } {
		return { title: "", url: "" };
	}

	writeBookmark(title: string, url: string, type?: "selection" | "clipboard"): void {
		console.log(`writeBookmark: ${title} - ${url}`, type);
	}
}

export const clipboard = new Clipboard();

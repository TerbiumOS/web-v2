interface diagArgs {
	title?: string;
	defaultPath?: string;
	properties?: ("openFile" | "openDirectory" | "multiSelections" | "showHiddenFiles")[];
	buttonLabel?: string;
	filters?: { name: string; extensions: string[] }[];
	message?: string;
}

interface MessageBoxOptions {
	message: string;
	title?: string;
	type?: "none" | "info" | "error" | "question" | "warning";
	buttons?: string[];
	defaultId?: number;
	cancelId?: number;
	noLink?: boolean;
	normalizeAccessKeys?: boolean;
}

export class Dialog {
	showOpenDialogSync(win: any, options: diagArgs) {
		console.log(`property: ${win} wont be used sorry`);
		return new Promise((resolve, reject) => {
			window.tb.dialog.FileBrowser({
				title: options.title || "Open File",
				defualtDir: options.defaultPath || "/",
				onOk: (path: string) => {
					resolve(path);
					console.log(path);
				},
				onCancel: () => reject("canceled"),
			});
		});
	}
	showOpenDialog(win: any, options: diagArgs) {
		return this.showOpenDialogSync(win, options);
	}
	showSaveDialogSync(win: any, options: diagArgs) {
		console.log(`property: ${win} wont be used sorry`);
		return new Promise((resolve, reject) => {
			window.tb.dialog.SaveFile({
				title: options.title || "Save File",
				defualtDir: options.defaultPath || "/",
				onOk: (path: string) => {
					resolve(path);
					console.log(path);
				},
				onCancel: () => reject("canceled"),
			});
		});
	}
	showSaveDialog(win: any, options: diagArgs) {
		return this.showSaveDialogSync(win, options);
	}
	showMessageBoxSync(_win: any, options: MessageBoxOptions) {
		console.log("Using Terbium dialog system");
		return new Promise(resolve => {
			window.tb.dialog.Message({
				title: options.title || "Message",
				defaultValue: options.message,
				onOk: () => {
					resolve({ response: options.defaultId || 0, checkboxChecked: false });
				},
			});
		});
	}
	showMessageBox(win: any, options: MessageBoxOptions) {
		return this.showMessageBoxSync(win, options);
	}
	showErrorBox(title: string, content: string) {
		window.tb.dialog.Alert({
			title: title,
			message: content,
			onOk: () => {},
		});
	}

	showCertificateTrustDialog(_win: any, _options: { certificate: any; message: string }) {
		console.log("Certificate trust dialog not implemented in web environment");
		return Promise.resolve();
	}
}

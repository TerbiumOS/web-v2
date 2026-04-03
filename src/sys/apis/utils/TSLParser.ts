import { version } from "../../../../package.json";
type AttrMap = Record<string, string>;
export interface TSLManifest {
	id?: string;
	title?: string;
	icon?: string;
	version?: string;
	author?: string;
	attributes: AttrMap;
	entries: Record<string, string>;
}
export interface TSLSidebarItem {
	id: string;
	title?: string;
	icon?: string;
	isDefault: boolean;
	attributes: AttrMap;
}
export interface TSLControl {
	type: string;
	label?: string;
	bind?: string;
	action?: string;
	attributes: AttrMap;
}
export interface TSLSection {
	title?: string;
	controls: TSLControl[];
	attributes: AttrMap;
}
export interface TSLView {
	id: string;
	title?: string;
	sections: TSLSection[];
	attributes: AttrMap;
}
export interface TSLRecommendedOption {
	id: string;
	text?: string;
	view?: string;
	action?: string;
	attributes: AttrMap;
}
export interface TSLScript {
	id: string;
	source: string;
	attributes: AttrMap;
}
export interface TSLUI {
	sidebar: TSLSidebarItem[];
	views: TSLView[];
	recommendedOptions: TSLRecommendedOption[];
}
export interface TSLDocument {
	path?: string;
	raw: string;
	manifest: TSLManifest;
	ui: TSLUI;
	scripts: Record<string, string>;
	actions: Record<string, string>;
}
export interface TSLValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}
export interface TSLActionExecutionOptions {
	timeoutMs?: number;
	additionalGlobals?: Record<string, unknown>;
}
type TSLActionContext = Record<string, unknown>;
const DEFAULT_ACTION_TIMEOUT_MS = 5000;
const FORBIDDEN_ACTION_TOKENS = ["window", "document", "globalThis", "self", "top", "parent", "Function", "eval", "import(", "XMLHttpRequest", "WebSocket", "Worker", "localStorage", "sessionStorage", "indexedDB", "navigator", "location", "history", "postMessage"];
export class TSLParser {
	version = version;
	constructor() {
		console.log(`TSLParser version ${this.version} initialized.`);
	}
	async parseTSL(path: string): Promise<TSLDocument> {
		const contents = await window.tb.fs.promises.readFile(path, "utf8");
		return this.parseTSLString(contents, path);
	}
	parseTSLString(contents: string, path?: string): TSLDocument {
		const xml = new DOMParser().parseFromString(contents, "application/xml");
		const parserError = xml.querySelector("parsererror");
		if (parserError) {
			throw new Error(`Invalid TSL/XML: ${parserError.textContent?.trim() || "Unknown parser error"}`);
		}
		const root = xml.querySelector("TSL");
		if (!root) {
			throw new Error("Invalid TSL: missing <TSL> root element.");
		}
		const manifestNode = root.querySelector(":scope > Manifest");
		const uiNode = root.querySelector(":scope > UI > SettingsPage");
		const scriptsNode = root.querySelector(":scope > Scripts");
		const actionsNode = root.querySelector(":scope > Actions");
		if (!manifestNode) {
			throw new Error("Invalid TSL: missing <Manifest> element.");
		}
		if (!uiNode) {
			throw new Error("Invalid TSL: missing <UI><SettingsPage> section.");
		}
		const manifest = this.parseManifest(manifestNode);
		const ui = this.parseUI(uiNode);
		const scripts = this.parseScripts(scriptsNode);
		const actions = this.parseActions(actionsNode);
		return {
			path,
			raw: contents,
			manifest,
			ui,
			scripts,
			actions,
		};
	}

	validate(document: TSLDocument): TSLValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];
		if (!document.manifest.id) errors.push("Manifest.Id is required.");
		if (!document.manifest.title) warnings.push("Manifest.Title is missing.");
		if (!document.ui.views.length) errors.push("At least one <View> is required.");
		const viewIds = new Set<string>();
		const sidebarIds = new Set<string>(document.ui.sidebar.map(item => item.id));
		document.ui.views.forEach(view => {
			if (!view.id) {
				errors.push("Each <View> must have an id attribute.");
				return;
			}
			if (viewIds.has(view.id)) {
				errors.push(`Duplicate view id: ${view.id}`);
			}
			viewIds.add(view.id);
		});
		document.ui.sidebar.forEach(item => {
			if (!item.id) errors.push("Each sidebar <Item> must have an id attribute.");
			if (item.id && !viewIds.has(item.id)) {
				warnings.push(`Sidebar item '${item.id}' has no matching view.`);
			}
		});
		document.ui.recommendedOptions.forEach(option => {
			if (!option.id) errors.push("Each recommended <Option> must have an id attribute.");
			if (option.view && !viewIds.has(option.view) && !sidebarIds.has(option.view)) {
				warnings.push(`Recommended option '${option.id}' points to unknown view '${option.view}'.`);
			}
			if (option.action && !document.actions[option.action]) {
				warnings.push(`Recommended option '${option.id}' references unknown action '${option.action}'.`);
			}
		});
		document.ui.views.forEach(view => {
			view.sections.forEach(section => {
				section.controls.forEach(control => {
					if (control.type === "Button" && !control.action) {
						warnings.push(`Button in view '${view.id}' is missing an action attribute.`);
					}
					if (control.action && !document.actions[control.action]) {
						warnings.push(`Control in view '${view.id}' references unknown action '${control.action}'.`);
					}
				});
			});
		});
		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
	getView(document: TSLDocument, id: string): TSLView | undefined {
		return document.ui.views.find(view => view.id === id);
	}
	listViewIds(document: TSLDocument): string[] {
		return document.ui.views.map(view => view.id);
	}
	listActionIds(document: TSLDocument): string[] {
		return Object.keys(document.actions);
	}
	getActionSource(document: TSLDocument, actionId: string): string | undefined {
		return document.actions[actionId];
	}
	async executeAction(document: TSLDocument, actionId: string, context: TSLActionContext = {}, options: TSLActionExecutionOptions = {}): Promise<unknown> {
		const source = this.getActionSource(document, actionId);
		if (!source) {
			throw new Error(`Action '${actionId}' does not exist.`);
		}
		return this.executeActionSource(source, context, options);
	}
	async executeActionSource(source: string, context: TSLActionContext = {}, options: TSLActionExecutionOptions = {}): Promise<unknown> {
		this.assertActionIsSafe(source);
		const timeoutMs = options.timeoutMs ?? DEFAULT_ACTION_TIMEOUT_MS;
		const sandbox = this.createActionSandbox(context, options.additionalGlobals ?? {});
		const runner = new Function(
			"sandbox",
			`"use strict";
const window = undefined;
const document = undefined;
const globalThis = undefined;
const self = undefined;
const top = undefined;
const parent = undefined;
const Function = undefined;
const eval = undefined;
const XMLHttpRequest = undefined;
const WebSocket = undefined;
const Worker = undefined;
const localStorage = undefined;
const sessionStorage = undefined;
const indexedDB = undefined;
const navigator = undefined;
const location = undefined;
const history = undefined;
const postMessage = undefined;

const tb = sandbox.tb;
const context = sandbox.context;
const console = sandbox.console;
const setTimeout = sandbox.setTimeout;
const clearTimeout = sandbox.clearTimeout;
const Promise = sandbox.Promise;
const Math = sandbox.Math;
const Date = sandbox.Date;
const JSON = sandbox.JSON;
const URL = sandbox.URL;

const action = (${source});
if (typeof action !== "function") {
  throw new Error("TSL action must evaluate to a function.");
}

return action(context);`,
		) as (sandboxParam: Record<string, unknown>) => unknown;
		const execution = Promise.resolve(runner(sandbox));
		return this.withTimeout(execution, timeoutMs);
	}

	private parseManifest(manifestNode: Element): TSLManifest {
		const entries: Record<string, string> = {};
		const children = Array.from(manifestNode.children);
		children.forEach(child => {
			entries[child.tagName] = (child.textContent || "").trim();
		});
		return {
			id: entries.Id,
			title: entries.Title,
			icon: entries.Icon,
			version: entries.Version,
			author: entries.Author,
			attributes: this.getAttributes(manifestNode),
			entries,
		};
	}

	private parseUI(settingsPageNode: Element): TSLUI {
		const sidebarItems: TSLSidebarItem[] = [];
		const views: TSLView[] = [];
		const recommendedOptions: TSLRecommendedOption[] = [];
		const sidebar = settingsPageNode.querySelector(":scope > Sidebar");
		if (sidebar) {
			Array.from(sidebar.querySelectorAll(":scope > Item")).forEach(itemNode => {
				const attrs = this.getAttributes(itemNode);
				sidebarItems.push({
					id: attrs.id || "",
					title: attrs.title,
					icon: attrs.icon,
					isDefault: this.toBoolean(attrs.default),
					attributes: attrs,
				});
			});
		}
		const content = settingsPageNode.querySelector(":scope > Content");
		const recommended = settingsPageNode.querySelector(":scope > RecommendedOptions");
		if (recommended) {
			Array.from(recommended.querySelectorAll(":scope > Option")).forEach(optionNode => {
				const attrs = this.getAttributes(optionNode);
				recommendedOptions.push({
					id: attrs.id || "",
					text: attrs.text,
					view: attrs.view,
					action: attrs.action,
					attributes: attrs,
				});
			});
		}
		if (content) {
			Array.from(content.querySelectorAll(":scope > View")).forEach(viewNode => {
				const viewAttrs = this.getAttributes(viewNode);
				const sections: TSLSection[] = [];
				Array.from(viewNode.querySelectorAll(":scope > Section")).forEach(sectionNode => {
					const sectionAttrs = this.getAttributes(sectionNode);
					const controls: TSLControl[] = [];
					Array.from(sectionNode.children).forEach(controlNode => {
						const controlAttrs = this.getAttributes(controlNode);
						controls.push({
							type: controlNode.tagName,
							label: controlAttrs.label,
							bind: controlAttrs.bind,
							action: controlAttrs.action,
							attributes: controlAttrs,
						});
					});
					sections.push({
						title: sectionAttrs.title,
						controls,
						attributes: sectionAttrs,
					});
				});
				views.push({
					id: viewAttrs.id || "",
					title: viewAttrs.title,
					sections,
					attributes: viewAttrs,
				});
			});
		}
		return {
			sidebar: sidebarItems,
			views,
			recommendedOptions,
		};
	}

	private parseActions(actionsNode: Element | null): Record<string, string> {
		const actions: Record<string, string> = {};
		if (!actionsNode) {
			return actions;
		}
		Array.from(actionsNode.querySelectorAll(":scope > Action")).forEach(actionNode => {
			const id = actionNode.getAttribute("id")?.trim();
			if (!id) return;

			actions[id] = (actionNode.textContent || "").trim();
		});
		return actions;
	}

	private parseScripts(scriptsNode: Element | null): Record<string, string> {
		const scripts: Record<string, string> = {};
		if (!scriptsNode) {
			return scripts;
		}
		Array.from(scriptsNode.querySelectorAll(":scope > Script")).forEach(scriptNode => {
			const id = scriptNode.getAttribute("id")?.trim();
			if (!id) return;

			scripts[id] = (scriptNode.textContent || "").trim();
		});
		return scripts;
	}

	private getAttributes(node: Element): AttrMap {
		const attrs: AttrMap = {};
		Array.from(node.attributes).forEach(attr => {
			attrs[attr.name] = attr.value;
		});
		return attrs;
	}

	private toBoolean(value?: string): boolean {
		if (!value) return false;
		const normalized = value.trim().toLowerCase();
		return normalized === "true" || normalized === "1" || normalized === "yes";
	}

	private assertActionIsSafe(source: string): void {
		for (const token of FORBIDDEN_ACTION_TOKENS) {
			const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const isIdentifierToken = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(token);
			const pattern = isIdentifierToken ? new RegExp(`\\b${escaped}\\b`) : new RegExp(escaped);
			if (pattern.test(source)) {
				throw new Error(`Blocked unsafe action token: ${token}`);
			}
		}
	}

	private createActionSandbox(context: TSLActionContext, additionalGlobals: Record<string, unknown>): Record<string, unknown> {
		const tb = window.tb;
		const sandboxContext = Object.freeze({
			...context,
			tb,
		});
		return Object.freeze({
			tb,
			context: sandboxContext,
			console: Object.freeze({
				log: (...args: unknown[]) => console.log("[TSL action]", ...args),
				warn: (...args: unknown[]) => console.warn("[TSL action]", ...args),
				error: (...args: unknown[]) => console.error("[TSL action]", ...args),
			}),
			setTimeout,
			clearTimeout,
			Promise,
			Math,
			Date,
			JSON,
			URL,
			...additionalGlobals,
		});
	}

	private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
		if (timeoutMs <= 0) {
			return promise;
		}
		let timer: number | undefined;
		const timeoutPromise = new Promise<never>((_, reject) => {
			timer = window.setTimeout(() => reject(new Error(`TSL action timed out after ${timeoutMs}ms`)), timeoutMs);
		});
		try {
			return await Promise.race([promise, timeoutPromise]);
		} finally {
			if (timer !== undefined) window.clearTimeout(timer);
		}
	}
}

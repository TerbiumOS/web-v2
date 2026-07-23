export interface BootEntry {
	name: string;
	file: string;
	[key: string]: unknown;
}

export const DEFAULT_BOOT_ENTRIES: BootEntry[] = [
	{ name: "TB React", file: "tb:root" },
	{ name: "TB React (Cloaked)", file: "tb:root-cloak" },
	{ name: "TB System Recovery", file: "tb:recovery" },
];

const LEGACY_BOOTFILE_REGEX = /sessionStorage\.setItem\(\s*["']bootfile["']\s*,\s*["']([^"']+)["']\s*\)/;
const LEGACY_BOOT_REGEX = /sessionStorage\.setItem\(\s*["']boot["']\s*,\s*["']true["']\s*\)/;
const LEGACY_RECOVERY_REGEX = /sessionStorage\.setItem\(\s*["']recovery["']\s*,\s*["']true["']\s*\)/;
const LEGACY_CLOAK_REGEX = /window\.location\.href\s*=\s*["']https:\/\/google\.com["']/;

export function normalizeBootEntry(entry: any): BootEntry {
	const name = String(entry?.name ?? "Unknown Boot Entry");
	const normalized: BootEntry = { ...entry, name } as BootEntry;
	if (typeof entry?.file === "string" && entry.file.trim() !== "") {
		normalized.file = entry.file;
		delete (normalized as any).action;
		return normalized;
	}
	if (typeof entry?.action === "string") {
		const action = entry.action;
		const match = action.match(LEGACY_BOOTFILE_REGEX);
		if (match) {
			normalized.file = match[1];
			delete (normalized as any).action;
			return normalized;
		}
		if (LEGACY_RECOVERY_REGEX.test(action)) {
			normalized.file = "tb:recovery";
			delete (normalized as any).action;
			return normalized;
		}
		if (LEGACY_BOOT_REGEX.test(action)) {
			normalized.file = LEGACY_CLOAK_REGEX.test(action) ? "tb:root-cloak" : "tb:root";
			delete (normalized as any).action;
			return normalized;
		}
	}
	normalized.file = "tb:root";
	delete (normalized as any).action;
	return normalized;
}

export function upgradeLegacyBootEntries(entries: any[]): { entries: BootEntry[]; changed: boolean } {
	const normalizedEntries = entries.map(normalizeBootEntry);
	const changed = entries.some((entry, index) => {
		const normalized = normalizedEntries[index];
		return typeof entry.file !== "string" || entry.file !== normalized.file || typeof entry.action === "string";
	});
	return { entries: normalizedEntries, changed };
}

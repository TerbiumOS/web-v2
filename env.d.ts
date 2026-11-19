declare namespace NodeJS {
	interface ProcessEnv {
		Edition?: "normal" | "lite";
		port: number;
		masqr: boolean;
		licensingURL: string | any;
		whitelistedDomains: string[];
	}
}

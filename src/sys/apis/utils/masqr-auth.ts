export function getHmacSecret(): string {
	let secret = localStorage.getItem("masqrv2_hmac_secret");
	if (!secret) {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		secret = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
		localStorage.setItem("masqrv2_hmac_secret", secret);
	}
	return secret;
}

export async function signRequest(data: Record<string, any>): Promise<{ signature: string; timestamp: number }> {
	const timestamp = Date.now();
	const secret = getHmacSecret();
	const sortedData: Record<string, any> = {};
	Object.keys(data)
		.sort()
		.forEach(key => {
			sortedData[key] = data[key];
		});
	const message = JSON.stringify(sortedData) + timestamp;
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(message);
	const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
	const hexSignature = Array.from(new Uint8Array(signature))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");

	return { signature: hexSignature, timestamp };
}

export function isValidKeyFormat(key: string): boolean {
	return /^TB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/i.test(key);
}

export function formatActivationKey(input: string): string {
	const cleaned = input.replace(/[^A-Z0-9]/gi, "").toUpperCase();
	let formatted = cleaned;
	if (!formatted.startsWith("TB")) {
		formatted = "TB" + formatted;
	}
	const withoutPrefix = formatted.substring(2);
	const segments: string[] = [];
	for (let i = 0; i < withoutPrefix.length && segments.length < 4; i += 4) {
		segments.push(withoutPrefix.substring(i, i + 4));
	}
	return "TB-" + segments.join("-");
}

export async function validateActivationKey(key: string): Promise<{ success: boolean; error?: string; sessionToken?: string; duration?: number; expiresAt?: string }> {
	const licenseServerUrl = import.meta.env.VITE_LICENSE_SERVER_URL as string;
	if (!licenseServerUrl) {
		return {
			success: false,
			error: "License server not configured. Please configure in settings.",
		};
	}
	if (!isValidKeyFormat(key)) {
		return {
			success: false,
			error: "Invalid activation key format. Expected: TB-XXXX-XXXX-XXXX-XXXX",
		};
	}
	try {
		const host = window.location.hostname || "localhost";
		const response = await fetch(`${licenseServerUrl}/api/validate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				key,
				host,
			}),
		});
		const result = await response.json();
		if (result.valid) {
			localStorage.setItem("masqrv2_session_token", result.sessionToken);
			localStorage.setItem("masqrv2_session_expiry", result.expiresAt);
			return {
				success: true,
				sessionToken: result.sessionToken,
				duration: result.duration,
				expiresAt: result.expiresAt,
			};
		} else {
			const errorMessages: Record<string, string> = {
				INVALID_KEY: "Activation key is invalid or has expired",
				KEY_EXPIRED: "This activation key has expired",
				MAX_HOSTS_EXCEEDED: "This activation key is already in use on the maximum number of devices",
				RATE_LIMITED: "Too many attempts. Please try again in a few minutes",
				KEY_RATE_LIMITED: "This activation key has been used too frequently. Please try again later",
				INVALID_SIGNATURE: "Authentication failed. Please try again",
				TIMESTAMP_EXPIRED: "Request expired. Please check your system clock",
			};
			return {
				success: false,
				error: errorMessages[result.error] || result.message || "Activation failed",
			};
		}
	} catch (error) {
		console.error("Activation error:", error);
		return {
			success: false,
			error: "Could not connect to license server. Please check your internet connection",
		};
	}
}

export function hasValidSession(): boolean {
	const token = localStorage.getItem("masqrv2_session_token");
	const expiry = localStorage.getItem("masqrv2_session_expiry");
	if (!token || !expiry) {
		return false;
	}
	const expiryDate = new Date(expiry);
	const now = new Date();
	return expiryDate > now;
}

export async function verifySession(): Promise<boolean> {
	const token = localStorage.getItem("masqrv2_session_token");
	const licenseServerUrl = import.meta.env.VITE_LICENSE_SERVER_URL as string;
	if (!token || !licenseServerUrl) {
		return false;
	}
	try {
		const response = await fetch(`${licenseServerUrl}/api/validate/session`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ sessionToken: token }),
		});
		const result = await response.json();
		if (result.valid) {
			localStorage.setItem("masqrv2_session_expiry", result.expiresAt);
			return true;
		} else {
			clearSession();
			return false;
		}
	} catch (error) {
		console.error("Session verification error:", error);
		return false;
	}
}

export function clearSession(): void {
	localStorage.removeItem("masqrv2_session_token");
	localStorage.removeItem("masqrv2_session_expiry");
}

export function getSessionToken(): string | null {
	return localStorage.getItem("masqrv2_session_token");
}

export function getSessionExpiry(): Date | null {
	const expiry = localStorage.getItem("masqrv2_session_expiry");
	return expiry ? new Date(expiry) : null;
}

export function isActivationEnabled(): boolean {
	console.log(import.meta.env.VITE_ACTIVATION_ENABLED);
	return import.meta.env.VITE_ACTIVATION_ENABLED === "true";
}

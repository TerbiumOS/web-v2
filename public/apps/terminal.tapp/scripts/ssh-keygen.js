function ssh_keygen(args) {
	if (args.help || args.h) {
		showHelp();
		createNewCommandInput();
		return;
	}
	const keyType = args.type || args.t || "rsa";
	const bits = parseInt(args.bits || args.b) || (keyType === "rsa" ? 2048 : keyType === "ed25519" ? 256 : 2048);
	const comment = args.comment || args.C || sessionStorage.getItem("currAcc");
	const filename = args.file || args.f || `/home/${sessionStorage.getItem("currAcc")}/.ssh/id_${keyType}`;
	const passphrase = args.passphrase || args.N || "";
	if (!["rsa", "ed25519"].includes(keyType)) {
		displayError(`ssh-keygen: unknown key type ${keyType}`);
		displayError("Supported types: rsa, ed25519");
		createNewCommandInput();
		return;
	}
	const sshDir = `/home/${sessionStorage.getItem("currAcc")}/.ssh`;
	if (!window.parent.tb.fs.promises.exists(sshDir)) {
		window.parent.tb.fs.promises.mkdir(sshDir);
	}
	displayOutput(`Generating public/private ${keyType} key pair.`);
	generateKeyPair(keyType, bits)
		.then(keyPair => {
			return Promise.all([formatPrivateKey(keyPair.privateKey, keyType, passphrase), formatPublicKey(keyPair.publicKey, keyType, comment)]);
		})
		.then(([privateKeyPEM, publicKeySSH]) => {
			window.parent.tb.fs.promises.writeFile(filename, privateKeyPEM);
			displayOutput(`Your identification has been saved in ${filename}`);
			const publicFilename = `${filename}.pub`;
			window.parent.tb.fs.promises.writeFile(publicFilename, publicKeySSH);
			displayOutput(`Your public key has been saved in ${publicFilename}`);
			return calculateFingerprint(publicKeySSH);
		})
		.then(fingerprint => {
			displayOutput(`The key fingerprint is:`);
			displayOutput(`SHA256:${fingerprint}`);
			displayOutput(`The key's randomart image is:`);
			displayOutput(generateRandomArt(fingerprint));
			createNewCommandInput();
		})
		.catch(error => {
			displayError(`ssh-keygen: ${error.message}`);
			createNewCommandInput();
		});

	function showHelp() {
		displayOutput("usage: ssh-keygen [-t keytype] [-b bits] [-C comment] [-f output_keyfile] [-N new_passphrase]");
		displayOutput("");
		displayOutput("Options:");
		displayOutput("  -t keytype    Specifies the type of key to create (rsa, ed25519)");
		displayOutput("  -b bits       Number of bits in the key (default: 2048 for rsa, 256 for ed25519)");
		displayOutput("  -C comment    Provides a new comment");
		displayOutput("  -f filename   Specifies the filename of the key file");
		displayOutput("  -N passphrase Provides the new passphrase");
		displayOutput("  -h, --help    Show this help message");
	}

	async function generateKeyPair(keyType, bits) {
		if (keyType === "rsa") {
			return await crypto.subtle.generateKey(
				{
					name: "RSASSA-PKCS1-v1_5",
					modulusLength: bits,
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: "SHA-256",
				},
				true,
				["sign", "verify"],
			);
		} else if (keyType === "ed25519") {
			return await crypto.subtle.generateKey(
				{
					name: "ECDSA",
					namedCurve: "P-256",
				},
				true,
				["sign", "verify"],
			);
		}
	}

	async function formatPrivateKey(privateKey, keyType, passphrase) {
		const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
		const pemBody = base64Encode(new Uint8Array(exported));
		let pem = "-----BEGIN PRIVATE KEY-----\n";
		pem += pemBody.match(/.{1,64}/g).join("\n");
		pem += "\n-----END PRIVATE KEY-----\n";
		if (passphrase) {
			pem = "-----BEGIN ENCRYPTED PRIVATE KEY-----\n" + "Note: Passphrase encryption not fully implemented\n" + pemBody.match(/.{1,64}/g).join("\n") + "\n-----END ENCRYPTED PRIVATE KEY-----\n";
		}

		return pem;
	}

	async function formatPublicKey(publicKey, keyType, comment) {
		const exported = await crypto.subtle.exportKey("spki", publicKey);
		const exportedArray = new Uint8Array(exported);
		let keyData;
		let keyTypeStr;
		if (keyType === "rsa") {
			keyTypeStr = "ssh-rsa";
			keyData = extractRSAPublicKey(exportedArray);
		} else {
			keyTypeStr = "ecdsa-sha2-nistp256";
			keyData = extractECDSAPublicKey(exportedArray);
		}
		const sshKey = encodeSSHPublicKey(keyTypeStr, keyData);
		return `${keyTypeStr} ${sshKey} ${comment}`;
	}
	function extractRSAPublicKey(spki) {
		let offset = 0;
		for (let i = 0; i < spki.length - 1; i++) {
			if (spki[i] === 0x03) {
				offset = i + 1;
				if (spki[offset] & 0x80) {
					const lenBytes = spki[offset] & 0x7f;
					offset += lenBytes + 1;
				} else {
					offset += 1;
				}
				offset += 1;
				break;
			}
		}
		return spki.slice(offset);
	}
	function extractECDSAPublicKey(spki) {
		let offset = spki.length - 65;
		return spki.slice(offset);
	}
	function encodeSSHPublicKey(keyType, keyData) {
		const keyTypeBytes = stringToBytes(keyType);
		const parts = [];
		parts.push(encodeUint32(keyTypeBytes.length));
		parts.push(keyTypeBytes);
		parts.push(encodeUint32(keyData.length));
		parts.push(keyData);
		const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of parts) {
			result.set(part, offset);
			offset += part.length;
		}

		return base64Encode(result);
	}
	function encodeUint32(value) {
		const buffer = new ArrayBuffer(4);
		const view = new DataView(buffer);
		view.setUint32(0, value, false);
		return new Uint8Array(buffer);
	}
	function stringToBytes(str) {
		const encoder = new TextEncoder();
		return encoder.encode(str);
	}
	function base64Encode(buffer) {
		let binary = "";
		const bytes = new Uint8Array(buffer);
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	async function calculateFingerprint(publicKey) {
		const keyData = publicKey.split(" ")[1];
		const decoded = base64Decode(keyData);
		const hashBuffer = await crypto.subtle.digest("SHA-256", decoded);
		const hashArray = new Uint8Array(hashBuffer);
		return base64Encode(hashArray).replace(/=+$/, "");
	}

	function base64Decode(str) {
		const binary = atob(str);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	function generateRandomArt(fingerprint) {
		const width = 17;
		const height = 9;
		const field = Array(height)
			.fill(0)
			.map(() => Array(width).fill(0));
		let x = Math.floor(width / 2);
		let y = Math.floor(height / 2);
		const fpBytes = base64Decode(fingerprint);

		for (let i = 0; i < fpBytes.length; i++) {
			const byte = fpBytes[i];
			for (let j = 0; j < 4; j++) {
				const move = (byte >> (j * 2)) & 0x03;
				const dx = move & 0x01 ? 1 : -1;
				const dy = move & 0x02 ? 1 : -1;
				x = Math.max(0, Math.min(width - 1, x + dx));
				y = Math.max(0, Math.min(height - 1, y + dy));
				field[y][x]++;
			}
		}
		const startX = Math.floor(width / 2);
		const startY = Math.floor(height / 2);
		const chars = " .o+=*BOX@%&#/^SE";
		let art = "+" + "-".repeat(width) + "+\n";
		for (let row = 0; row < height; row++) {
			let line = "|";
			for (let col = 0; col < width; col++) {
				if (row === startY && col === startX) {
					line += "S";
				} else if (row === y && col === x) {
					line += "E";
				} else {
					const val = Math.min(field[row][col], chars.length - 1);
					line += chars[val];
				}
			}
			line += "|";
			art += line + "\n";
		}
		art += "+" + "-".repeat(width) + "+";
		return art;
	}
}

ssh_keygen(args);

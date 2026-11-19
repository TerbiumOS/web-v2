import { version } from "../../../package.json";
import { hash, repository } from "../../hash.json";

export class System {
	version(type: string | number) {
		if (type === "string") return version.toString();
		else if (type === "number") return Number(version);
	}
	instance = {
		repo: repository,
		hash: hash,
	};
	edition() {
		return import.meta.env.VITE_EDITION === "lite" ? "lite" : "normal";
	}
}

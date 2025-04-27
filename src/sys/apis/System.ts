import { version } from "../../../package.json"
import { hash, repository } from "../../hash.json"

export class System {
    version(type: string | number) {
        if(type === "string") return version.toString();
        else if(type === "number") return Number(version);
    }
    git() {
        return {
            hash, repository
        }
    }
    works(type: string) {
        return typeof type !== "undefined";
    }
}
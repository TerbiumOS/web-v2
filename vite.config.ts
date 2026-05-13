import { scramjetPath } from "@mercuryworkshop/scramjet/path";
// @ts-expect-error no types
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import react from "@vitejs/plugin-react-swc";
import config from "dotenv";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { tfsPath } from "@terbiumos/tfs";
import path from "node:path";

config.config();

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				// These are copied so that Terbium will still work statically
				{
					src: `${scramjetPath}/**/*`.replace(/\\/g, "/"),
					dest: "scram",
					overwrite: false,
				},
				{
					src: `${tfsPath}/**/*`.replace(/\\/g, "/"),
					dest: "tfs",
					overwrite: false,
				},
				{
					src: `${path.resolve("node_modules/@mercuryworkshop/scramjet-controller/dist/")}/**/*.{js,js.map}`.replace(/\\/g, "/"),
					dest: "sj-control",
					overwrite: false,
				},
			],
		}),
		{
			name: "vite-wisp-server",
			configureServer(server) {
				server.httpServer?.on("upgrade", (req, socket, head) => (req.url?.startsWith("/wisp") ? wisp.routeRequest(req, socket, head) : undefined));
			},
		},
	],
	server: {
		port: process.env.port || 3001,
		watch: {
			ignored: ["**/public/apps/terminal.tapp/**"],
		},
		headers: {
			"cross-origin-embedder-policy": "require-corp",
		},
	},
});

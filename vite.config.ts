import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
// @ts-expect-error no types
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
// @ts-expect-error no types
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import react from "@vitejs/plugin-react-swc";
import config from "dotenv";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { tfsPath } from "@terbiumos/tfs";

config.config();

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				// These are copied so that Terbium will still work statically
				{
					src: `${uvPath}/**/*`.replace(/\\/g, "/"),
					dest: "uv",
					overwrite: false,
				},
				{
					src: `${scramjetPath}/**/*`.replace(/\\/g, "/"),
					dest: "scram",
					overwrite: false,
				},
				{
					src: `${baremuxPath}/**/*`.replace(/\\/g, "/"),
					dest: "baremux",
					overwrite: false,
				},
				{
					src: `${epoxyPath}/**/*`.replace(/\\/g, "/"),
					dest: "epoxy",
					overwrite: false,
				},
				{
					src: `${libcurlPath}/**/*`.replace(/\\/g, "/"),
					dest: "libcurl",
					overwrite: false,
				},
				{
					src: `${tfsPath}/**/*`.replace(/\\/g, "/"),
					dest: "tfs",
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
	},
});

import { serve } from "bun";
import index from "@/index.html";
import { genViewerPrompt } from "prompt";

const server = serve({
	routes: {
		"/*": index,
		"/prompt.txt": () =>
			new Response(genViewerPrompt(), {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
				},
			}),
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},

	port: 7898,
});

console.log(`🚀 Server running at ${server.url}`);

import { serve } from "bun";
import index from "./src/index.html";
import { genViewerPrompt } from "prompt";
import type { AnimationID, Avatar, UUID } from "@/types";
import {mkdirSync} from "fs";

const server = serve({
  routes: {
    "/*": index,
    "/prompt.txt": () => new Response(genViewerPrompt(), {
      headers: {
        'Content-Type': "text/plain; charset=utf-8",
      },
    }),
    "/minecraft-items.json": new Response(JSON.stringify({
      "minecraft:air": {id: "minecraft:air", name: "Air", imageUrl: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="},
      "minecraft:stone": {id: "minecraft:stone", name: "Stone", imageUrl: "https://minecraft.wiki/images/Invicon_Stone.png?909de"},
    })),
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

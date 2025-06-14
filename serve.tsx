import { serve } from "bun";
import index from "./src/index.html";
import { genViewerPrompt } from "prompt";
import type { AnimationID, Avatar, UUID } from "@/types";
import {mkdirSync} from "fs";

const defaultProject: Avatar = {
  "mainActionWheel": "0" as UUID,
  "actionWheels": {
    ["0" as UUID]: {
      "uuid": "0" as UUID,
      "title": "Main",
      "actions": [],
    },
  },
  toggleGroups: {},
  animationSettings: {
    ["model.sit" as AnimationID]: {
      animation: "model.sit" as AnimationID,
      name: "Sit",
    },
    ["model.lay" as AnimationID]: {
      animation: "model.lay" as AnimationID,
      name: "Lay",
    },
    ["model.jump" as AnimationID]: {
      animation: "model.jump" as AnimationID,
      name: "Jump",
    },
    ["model.idle" as AnimationID]: {
      animation: "model.idle" as AnimationID,
      name: "Idle",
    },
  },
  animations: [
    "model.sit" as AnimationID,
    "model.lay" as AnimationID,
    "model.jump" as AnimationID,
    "model.idle" as AnimationID,
  ],
};

const server = serve({
  routes: {
    "/*": index,
    "/prompt.txt": () => new Response(genViewerPrompt(), {
      headers: {
        'Content-Type': "text/plain; charset=utf-8",
      },
    }),
    "/project.json": {
      GET: async () => {
        let data: string = JSON.stringify(defaultProject);
        try { data = await Bun.file("data/project.json").text(); } catch (e) {
          console.error("error loading avatar: ", e);
        }
        return new Response(data, {
          headers: {
            'Content-Type': "application/json; charset=utf-8",
          },
        })
      },
      POST: async (req) => {
        mkdirSync(import.meta.dir + "/data", {recursive: true});
        await Bun.write("data/project.json", await req.text());
        return new Response("ok");
      },
    },
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

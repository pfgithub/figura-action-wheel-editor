// https://minecraftallimages.jemsire.com/

import { readdirSync } from "node:fs";
import type { Image, MinecraftItem } from "@/types";

const version = "1.21.5";
const folder = `${import.meta.dir}/data/all-items-${version}`;
const res: Record<string, MinecraftItem> = {};
for (const file of readdirSync(folder)) {
	if (!file.endsWith(".png")) continue;
	const nameOnly = file.slice(0, file.length - ".png".length);
	const ns = `minecraft:${nameOnly}`;
	const fileCont = await Bun.file(`${folder}/${file}`).arrayBuffer();
	const resp = await fetch("http://localhost:5566/api/image", {
		method: "PUT",
		body: fileCont,
	});
	if (resp.status !== 200) {
		console.error(`error for item ${file}: ${await resp.text()}`);
		continue;
	}
	const json = (await resp.json()) as Image;
	res[ns] = { id: ns, name: nameOnly, image: json };
}
await Bun.write(`src/data/items/${version}.json`, JSON.stringify(res, null, 2));

import { generateLua, parseLua } from "@/data/generateLua";

const fpath =
	"c:\\Users\\pfg\\GameSaves\\Minecraft\\Instances\\MyWorlds\\figura\\avatars\\Nova_next\\project.figura-editor.lua";
const file = parseLua(await Bun.file(fpath).text());
const res = generateLua(file);
console.log(res.split("%__DATA_MARKER__%")[2]);
await Bun.write(fpath, res);

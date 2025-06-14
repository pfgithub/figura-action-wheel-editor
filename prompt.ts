import {readFileSync, readdirSync} from "fs";
import {extname} from "path";

export function genViewerPrompt(): string {
    let res: string = "";
    const all = readdirSync(import.meta.dir + "/src", {recursive: true}).filter(q => typeof q === "string").map(q => q.replaceAll("\\", "/"));
console.log(all);
    for(const file of all) {
        let contents: string;
        try {
            contents = readFileSync(import.meta.dir + "/src/" + file, "utf-8");
        }catch(e) {
            continue;
        }
        res += "# File `src/"+file+"`\n\n"
        res += "```"+extname(file).slice(1) + "\n";
        res += contents;
        res += "\n```\n\n";
    }
    console.log(res);
    return res;
}
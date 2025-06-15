import {readFileSync, readdirSync} from "fs";
import {extname} from "path";

export function genViewerPrompt(): string {
    let allFiles: string = "# All files\n\n";
    let res: string = "";
    const all = readdirSync(import.meta.dir + "/src", {recursive: true}).filter(q => typeof q === "string").map(q => q.replaceAll("\\", "/"));
    for(const file of all) {
        let contents: string;
        try {
            contents = readFileSync(import.meta.dir + "/src/" + file, "utf-8");
        }catch(e) {
            continue;
        }
        allFiles += "- src/" + file + "\n";
        res += "# File `src/"+file+"`\n\n"
        res += "```"+extname(file).slice(1) + "\n";
        res += contents;
        res += "\n```\n\n";
    }
    return allFiles + "\n" + res;
}
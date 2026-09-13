import * as fs from "node:fs";
import * as path from "node:path";
import { activateSkill } from "../state.js";
export async function loadDevinConfig(api) {
    const cwd = process.cwd();
    const projectDir = path.join(cwd, ".devin");
    const globalDir = path.join(process.env.HOME || "", ".config", "devin");
    if (fs.existsSync(projectDir)) {
        console.log("[pi-devin] Loading project .devin/ configuration...");
        await loadSkills(path.join(projectDir, "skills"), api);
        await loadHooks(path.join(projectDir, "hooks.v1.json"));
        await noteMcp(path.join(projectDir, "mcp"));
    }
    if (fs.existsSync(globalDir)) {
        console.log("[pi-devin] Loading global ~/.config/devin/ configuration...");
        await loadSkills(path.join(globalDir, "skills"), api);
    }
}
async function loadSkills(skillsDir, api) {
    if (!fs.existsSync(skillsDir))
        return;
    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory())
            continue;
        const skillFile = path.join(skillsDir, dir.name, "SKILL.md");
        if (!fs.existsSync(skillFile))
            continue;
        const content = fs.readFileSync(skillFile, "utf8");
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        let desc = `Devin skill: ${dir.name}`;
        let prompt = content;
        if (match) {
            const frontmatter = match[1];
            prompt = match[2];
            const descMatch = frontmatter.match(/description:\s*(.*)/);
            if (descMatch)
                desc = descMatch[1].trim();
        }
        api.registerCommand(dir.name, {
            description: desc,
            handler: async (_args, ctx) => {
                activateSkill({ name: dir.name, prompt });
                ctx.ui.setStatus("devin", `Devin · skill:${dir.name}`);
                ctx.ui.notify(`Activated Devin skill: ${dir.name}`, "info");
            },
        });
    }
}
async function loadHooks(hooksFile) {
    if (!fs.existsSync(hooksFile))
        return;
    try {
        const hooksData = JSON.parse(fs.readFileSync(hooksFile, "utf8"));
        const keys = Object.keys(hooksData || {});
        console.log(`[pi-devin] Loaded hooks file with ${keys.length} top-level keys.`);
    }
    catch (err) {
        console.error("[pi-devin] Failed to parse .devin/hooks.v1.json", err);
    }
}
async function noteMcp(mcpDir) {
    if (!fs.existsSync(mcpDir))
        return;
    const entries = fs.readdirSync(mcpDir);
    if (entries.length > 0) {
        console.log(`[pi-devin] Found ${entries.length} entries under .devin/mcp/ (Pi MCP wiring is separate; not auto-started).`);
    }
}

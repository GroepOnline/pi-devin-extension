import * as fs from "node:fs";
import * as path from "node:path";
function messageText(message) {
    if (!message)
        return "";
    if (typeof message.content === "string")
        return message.content;
    if (Array.isArray(message.content)) {
        return message.content
            .map((c) => (typeof c === "string" ? c : c?.text || ""))
            .join("");
    }
    return "";
}
function attr(tag, name) {
    const re = new RegExp(`${name}="([^"]*)"`);
    const m = tag.match(re);
    return m?.[1];
}
/**
 * Intercepts assistant messages that contain Devin XML tags and executes
 * the actionable ones (shell / open_file / create_file / str_replace).
 */
export function setupXmlInterceptor(api) {
    api.on("message_end", async (event, ctx) => {
        if (event.message?.role !== "assistant")
            return;
        const content = messageText(event.message);
        if (!content.includes("<"))
            return;
        const notes = [];
        if (content.includes("<suggest_plan")) {
            notes.push("Plan suggested (<suggest_plan/>). Review before leaving planning mode.");
            ctx.ui.setStatus("devin", "Devin · plan suggested");
        }
        const envIssue = content.match(/<report_environment_issue>([\s\S]*?)<\/report_environment_issue>/);
        if (envIssue) {
            const msg = envIssue[1].trim();
            notes.push(`Environment issue: ${msg}`);
            ctx.ui.notify(`Devin environment issue: ${msg}`, "warning");
        }
        // <shell id="..." exec_dir="...">cmd</shell>
        const shellRe = /<shell\b([^>]*)>([\s\S]*?)<\/shell>/g;
        let shellMatch;
        while ((shellMatch = shellRe.exec(content)) !== null) {
            const meta = shellMatch[1];
            const cmd = shellMatch[2].trim();
            const execDir = attr(meta, "exec_dir") || process.cwd();
            const id = attr(meta, "id") || "default";
            if (!cmd)
                continue;
            try {
                const res = await api.exec("bash", ["-lc", cmd], { cwd: execDir });
                notes.push(`[shell:${id} @ ${execDir}] exit=${res.code}\n${(res.stdout || res.stderr || "").slice(0, 4000)}`);
            }
            catch (err) {
                notes.push(`[shell:${id}] failed: ${err.message}`);
            }
        }
        // <open_file path="..." />
        const openRe = /<open_file\b([^>]*)\/?>/g;
        let openMatch;
        while ((openMatch = openRe.exec(content)) !== null) {
            const filePath = attr(openMatch[1], "path");
            if (!filePath)
                continue;
            try {
                const abs = path.isAbsolute(filePath)
                    ? filePath
                    : path.join(process.cwd(), filePath);
                const text = fs.readFileSync(abs, "utf8");
                notes.push(`[open_file ${filePath}]\n${text.slice(0, 4000)}`);
            }
            catch (err) {
                notes.push(`[open_file ${filePath}] failed: ${err.message}`);
            }
        }
        // <create_file path="...">content</create_file>
        const createRe = /<create_file\b([^>]*)>([\s\S]*?)<\/create_file>/g;
        let createMatch;
        while ((createMatch = createRe.exec(content)) !== null) {
            const filePath = attr(createMatch[1], "path");
            if (!filePath)
                continue;
            try {
                const abs = path.isAbsolute(filePath)
                    ? filePath
                    : path.join(process.cwd(), filePath);
                fs.mkdirSync(path.dirname(abs), { recursive: true });
                fs.writeFileSync(abs, createMatch[2], "utf8");
                notes.push(`[create_file ${filePath}] wrote ${createMatch[2].length} bytes`);
            }
            catch (err) {
                notes.push(`[create_file ${filePath}] failed: ${err.message}`);
            }
        }
        // <str_replace path="..."><old>...</old><new>...</new></str_replace>
        // Also support Devin variants with old_str/new_str attributes or CDATA-like blocks.
        const replaceRe = /<str_replace\b([^>]*)>([\s\S]*?)<\/str_replace>/g;
        let replaceMatch;
        while ((replaceMatch = replaceRe.exec(content)) !== null) {
            const filePath = attr(replaceMatch[1], "path");
            const body = replaceMatch[2];
            if (!filePath)
                continue;
            const oldBlock = body.match(/<old(?:_str)?>([\s\S]*?)<\/old(?:_str)?>/)?.[1] ??
                body.match(/<old_str>([\s\S]*?)<\/old_str>/)?.[1];
            const newBlock = body.match(/<new(?:_str)?>([\s\S]*?)<\/new(?:_str)?>/)?.[1] ??
                body.match(/<new_str>([\s\S]*?)<\/new_str>/)?.[1];
            if (oldBlock == null || newBlock == null) {
                notes.push(`[str_replace ${filePath}] missing <old>/<new> blocks`);
                continue;
            }
            try {
                const abs = path.isAbsolute(filePath)
                    ? filePath
                    : path.join(process.cwd(), filePath);
                const current = fs.readFileSync(abs, "utf8");
                if (!current.includes(oldBlock)) {
                    notes.push(`[str_replace ${filePath}] old block not found`);
                    continue;
                }
                fs.writeFileSync(abs, current.replace(oldBlock, newBlock), "utf8");
                notes.push(`[str_replace ${filePath}] applied`);
            }
            catch (err) {
                notes.push(`[str_replace ${filePath}] failed: ${err.message}`);
            }
        }
        if (notes.length === 0)
            return;
        // Surface results to the session without forcing an infinite agent loop.
        api.sendMessage({
            customType: "devin-xml-results",
            content: notes.join("\n\n---\n\n"),
            display: true,
        }, { triggerTurn: false });
    });
}

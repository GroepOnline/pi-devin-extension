import { setMode } from "../state.js";
function switchMode(api, mode, label) {
    return async (_args, ctx) => {
        setMode(mode);
        ctx.ui.setStatus("devin", `Devin · ${mode}`);
        ctx.ui.notify(label, "info");
    };
}
export function registerModes(api) {
    api.registerCommand("normal", {
        description: "Devin normal mode (prompt for writes/exec)",
        handler: switchMode(api, "normal", "Switched to Devin Normal Mode. Ask before shell and file writes when unsure."),
    });
    api.registerCommand("accept-edits", {
        description: "Devin accept-edits mode (auto file edits)",
        handler: switchMode(api, "accept-edits", "Switched to Devin Accept-Edits Mode. Auto-edit files; prompt for shell."),
    });
    api.registerCommand("bypass", {
        description: "Devin bypass/YOLO mode (auto edit & shell)",
        handler: switchMode(api, "bypass", "Switched to Devin Bypass Mode (YOLO). Auto-run tools and shell."),
    });
    api.registerCommand("autonomous", {
        description: "Devin autonomous mode (prefer sandbox)",
        handler: switchMode(api, "autonomous", "Switched to Devin Autonomous Mode. Prefer sandboxed execution."),
    });
    api.registerCommand("plan", {
        description: "Devin planning mode (research + suggest_plan)",
        handler: switchMode(api, "planning", "Devin Planning Mode: research first, emit <suggest_plan/>, no writes yet."),
    });
    api.registerCommand("handoff", {
        description: "Handoff task stub (Cloud Devin)",
        handler: async (args, ctx) => {
            const task = (args || "").trim() || "(no task text)";
            ctx.ui.notify(`Handoff stub recorded for: ${task}. Cloud Devin packaging is not wired yet.`, "info");
            ctx.ui.setStatus("devin", "Devin · handoff stub");
        },
    });
}

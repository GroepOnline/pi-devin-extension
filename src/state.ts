export type DevinPermissionMode =
  | "normal"
  | "accept-edits"
  | "bypass"
  | "autonomous"
  | "planning";

export interface ActiveSkill {
  name: string;
  prompt: string;
}

const state = {
  mode: "normal" as DevinPermissionMode,
  skills: [] as ActiveSkill[],
};

export function getMode(): DevinPermissionMode {
  return state.mode;
}

export function setMode(mode: DevinPermissionMode): void {
  state.mode = mode;
}

export function getActiveSkills(): ActiveSkill[] {
  return state.skills;
}

export function activateSkill(skill: ActiveSkill): void {
  state.skills = state.skills.filter((s) => s.name !== skill.name);
  state.skills.push(skill);
}

export function clearSkills(): void {
  state.skills = [];
}

export function modeInstruction(): string {
  switch (state.mode) {
    case "planning":
      return [
        "You are currently in Devin 'planning' mode.",
        "Gather information, search the codebase, and propose a plan.",
        "When ready, emit <suggest_plan/>. Do NOT make file edits yet.",
      ].join(" ");
    case "accept-edits":
      return "Devin permission mode: accept-edits. Auto-apply file edits; ask before shell commands that change the system.";
    case "bypass":
      return "Devin permission mode: bypass (YOLO). Execute tools and shell commands without asking for confirmation.";
    case "autonomous":
      return "Devin permission mode: autonomous. Prefer sandboxed execution when available; stay scoped to the task.";
    default:
      return "Devin permission mode: normal. Ask before writes and shell execution when unsure.";
  }
}

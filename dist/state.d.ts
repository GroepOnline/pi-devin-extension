export type DevinPermissionMode = "normal" | "accept-edits" | "bypass" | "autonomous" | "planning";
export interface ActiveSkill {
    name: string;
    prompt: string;
}
export declare function getMode(): DevinPermissionMode;
export declare function setMode(mode: DevinPermissionMode): void;
export declare function getActiveSkills(): ActiveSkill[];
export declare function activateSkill(skill: ActiveSkill): void;
export declare function clearSkills(): void;
export declare function modeInstruction(): string;

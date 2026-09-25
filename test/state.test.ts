import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  activateSkill,
  clearSkills,
  getActiveSkills,
  getMode,
  modeInstruction,
  setMode,
} from "../src/state.ts";

const modes = [
  "normal",
  "accept-edits",
  "bypass",
  "autonomous",
  "planning",
] as const;

describe("devin permission state", () => {
  beforeEach(() => {
    setMode("normal");
    clearSkills();
  });

  test("starts in normal mode", () => {
    assert.equal(getMode(), "normal");
    assert.match(modeInstruction(), /permission mode: normal/);
  });

  for (const mode of modes) {
    test(`setMode(${mode}) is reflected by getMode and the instruction`, () => {
      setMode(mode);
      assert.equal(getMode(), mode);
      const instruction = modeInstruction();
      assert.match(instruction, new RegExp(mode));
      if (mode === "planning") {
        assert.match(instruction, /suggest_plan/);
        assert.match(instruction, /Do NOT make file edits yet/);
      }
    });
  }

  test("activateSkill replaces a skill with the same name and keeps others", () => {
    activateSkill({ name: "review", prompt: "first" });
    activateSkill({ name: "docs", prompt: "write docs" });
    activateSkill({ name: "review", prompt: "second" });
    assert.deepEqual(getActiveSkills(), [
      { name: "docs", prompt: "write docs" },
      { name: "review", prompt: "second" },
    ]);
  });

  test("clearSkills removes every active skill", () => {
    activateSkill({ name: "review", prompt: "first" });
    clearSkills();
    assert.deepEqual(getActiveSkills(), []);
  });
});

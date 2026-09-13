import * as path from "node:path";
import { Type } from "@sinclair/typebox";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

function agentBrowserBaseArgs(profile: string): string[] {
  return [
    "--engine",
    "lightpanda",
    "--profile",
    profile,
    "--session",
    "chefgroep-default",
    "--restore",
  ];
}

function textResult(text: string, _isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    details: null as null,
  };
}

/**
 * Registers Devin-shaped tools with real Lightpanda / pi execution.
 */
export function registerDevinTools(api: ExtensionAPI): void {
  const home = process.env.HOME || "/home/joep";
  const profile = path.join(home, ".config/chefgroep/agent-browser-chrome");

  api.registerTool(
    defineTool({
      name: "view_browser",
      label: "Browser Viewer (Lightpanda)",
      description:
        "Returns a truncated HTML snapshot of the current Lightpanda browser tab (ChefGroep agent-browser profile).",
      promptSnippet: "Capture current browser page HTML via Lightpanda",
      parameters: Type.Object({
        reload_window: Type.Optional(
          Type.Boolean({ description: "Whether to reload before capture" }),
        ),
        tab_idx: Type.Optional(
          Type.Number({ description: "Browser tab index (informational)" }),
        ),
      }),
      execute: async (_id, params, _signal, _onUpdate, _ctx) => {
        try {
          if (params.reload_window) {
            await api.exec("agent-browser", [
              ...agentBrowserBaseArgs(profile),
              "reload",
            ]);
          }
          const res = await api.exec("agent-browser", [
            ...agentBrowserBaseArgs(profile),
            "eval",
            "document.documentElement.outerHTML.slice(0, 4000)",
          ]);
          return textResult(
            res.stdout || res.stderr || "Browser content fetched via Lightpanda.",
            res.code !== 0,
          );
        } catch (err: any) {
          return textResult(`Browser view failed: ${err.message}`, true);
        }
      },
    }),
  );

  api.registerTool(
    defineTool({
      name: "navigate_browser",
      label: "Browser Navigator (Lightpanda)",
      description: "Opens a URL in Lightpanda via agent-browser (ChefGroep profile).",
      promptSnippet: "Open a URL in Lightpanda browser",
      parameters: Type.Object({
        url: Type.String({ description: "Absolute URL to open" }),
        tab_idx: Type.Optional(Type.Number({ description: "Tab index (informational)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, _ctx) => {
        try {
          const res = await api.exec("agent-browser", [
            ...agentBrowserBaseArgs(profile),
            "open",
            params.url,
          ]);
          return textResult(
            `Navigated to ${params.url}\n${res.stdout || res.stderr || ""}`.trim(),
            res.code !== 0,
          );
        } catch (err: any) {
          return textResult(`Browser navigation failed: ${err.message}`, true);
        }
      },
    }),
  );

  api.registerTool(
    defineTool({
      name: "go_to_definition",
      label: "LSP Go to Definition",
      description:
        "Best-effort definition lookup via ripgrep for the symbol near a file:line (LSP bridge stub).",
      promptSnippet: "Find symbol definition via ripgrep",
      parameters: Type.Object({
        path: Type.String(),
        line: Type.Number(),
        symbol: Type.String(),
      }),
      execute: async (_id, params) => {
        try {
          const res = await api.exec("rg", [
            "-n",
            "--type-add",
            "src:*.{ts,tsx,js,jsx,py,go,rs,java}",
            "-t",
            "src",
            `\\b${params.symbol}\\b`,
            path.dirname(params.path) || ".",
          ]);
          const header = `Definition search for ${params.symbol} (from ${params.path}:${params.line})`;
          return textResult(
            `${header}\n${res.stdout || res.stderr || "(no matches)"}`.trim(),
            false,
          );
        } catch (err: any) {
          return textResult(`go_to_definition failed: ${err.message}`, true);
        }
      },
    }),
  );

  api.registerTool(
    defineTool({
      name: "spawn_subagent_explore",
      label: "Spawn Explore Subagent",
      description:
        "Spawn a lightweight explore subagent (pi -p) to research the codebase and return findings.",
      promptSnippet: "Spawn a pi explore subagent for research",
      parameters: Type.Object({
        task: Type.String({ description: "What the explorer should find" }),
      }),
      execute: async (_id, params) => {
        try {
          const prompt = [
            "You are a read-only explore subagent.",
            "Research the codebase and report findings. Do not modify files.",
            `Task: ${params.task}`,
          ].join(" ");
          const res = await api.exec("pi", ["-p", prompt], {
            timeout: 180_000,
          });
          return textResult(
            `Explore subagent output:\n${res.stdout || res.stderr || "Task completed."}`,
            res.code !== 0,
          );
        } catch (err: any) {
          return textResult(`Subagent spawn failed: ${err.message}`, true);
        }
      },
    }),
  );
}

# @groeponline/pi-devin-extension

Pi-extensie die Pi laat handelen als Devin (Cognition): persona, modes, `.devin/` loader, Lightpanda browser tools, en XML-command bridge.

## Wat het doet

1. **Persona** — injecteert `devinPrompt.md` (of fallback) via `before_agent_start` vóór Pi's system prompt.
2. **Modes** — `/normal`, `/accept-edits`, `/bypass`, `/autonomous`, `/plan`, `/handoff`.
3. **`.devin/` loader** — project + `~/.config/devin/` skills als slash commands; hooks/mcp worden gelogd.
4. **Tools** — `navigate_browser` / `view_browser` (Lightpanda + ChefGroep profile), `go_to_definition` (rg), `spawn_subagent_explore` (`pi -p`).
5. **XML interceptor** — voert Devin tags uit (`<shell>`, `<open_file>`, `<create_file>`, `<str_replace>`, `<suggest_plan/>`) en toont resultaten in de sessie.

## Installatie

```bash
cd ~/Pi-factory/pi-devin-extension
npm install
npm run build
npm link
```

Zorg dat `~/.pi/agent/settings.json` dit bevat:

```json
"packages": [
  "npm:@groeponline/pi-devin-extension"
]
```

Start Pi:

```bash
pi
```

## Gebruik

```text
/accept-edits
/plan
```

Browser tools gebruiken altijd:

`agent-browser --engine lightpanda --profile ~/.config/chefgroep/agent-browser-chrome --session chefgroep-default --restore …`

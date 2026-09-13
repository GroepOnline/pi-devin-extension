import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { setupDevinPrompt } from "./prompt.js";
import { registerModes } from "./commands/modes.js";
import { registerDevinTools } from "./tools.js";
import { loadDevinConfig } from "./config/devin-loader.js";
import { setupXmlInterceptor } from "./xml-interceptor.js";

/**
 * Pi-Devin-Extension
 * Makes Pi behave like Devin: persona, modes, .devin/ loader, tools, XML bridge.
 *
 * Pi packages must default-export a factory: (pi: ExtensionAPI) => void | Promise<void>
 */
export default async function (pi: ExtensionAPI): Promise<void> {
  console.log("[pi-devin] Activating Devin mode...");

  setupDevinPrompt(pi);
  registerModes(pi);
  registerDevinTools(pi);
  setupXmlInterceptor(pi);
  await loadDevinConfig(pi);

  console.log("[pi-devin] Devin mode active.");
}

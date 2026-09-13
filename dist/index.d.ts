import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
/**
 * Pi-Devin-Extension
 * Makes Pi behave like Devin: persona, modes, .devin/ loader, tools, XML bridge.
 *
 * Pi packages must default-export a factory: (pi: ExtensionAPI) => void | Promise<void>
 */
export default function (pi: ExtensionAPI): Promise<void>;

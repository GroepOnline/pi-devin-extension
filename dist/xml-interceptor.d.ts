import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
/**
 * Intercepts assistant messages that contain Devin XML tags and executes
 * the actionable ones (shell / open_file / create_file / str_replace).
 */
export declare function setupXmlInterceptor(api: ExtensionAPI): void;

import { LunaUnload, Tracer } from "@luna/core";
import { MediaItem, redux } from "@luna/lib";

export const { trace } = Tracer("[ExamplePlugin]");

trace.msg.log(`Hello ${redux.store.getState().user.meta.profileName} from the Example plugin!`);

// Example plugin settings
export { Settings } from "./Settings";

// Functions in unloads are called when plugin is unloaded.
// Used to clean up resources, even listener dispose etc should be added here
export const unloads = new Set<LunaUnload>();

// Log to console whenever changing page
redux.intercept("page/SET_PAGE_ID", unloads, console.log);

MediaItem.onMediaTransition(unloads, async (mediaItem) => {
	const title = await mediaItem.title();
	alert(`Media item transitioned: ${title}`);
});

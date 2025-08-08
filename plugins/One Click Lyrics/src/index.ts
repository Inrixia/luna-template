import { Tracer, type LunaUnload } from "@luna/core";
import { ipcRenderer, MediaItem, ContextMenu, redux } from "@luna/lib";

export const { errSignal, trace } = Tracer("[OneClickLyrics]");
export const unloads = new Set<LunaUnload>();

const icon =
`<svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 8C5 5.17157 5 3.75736 5.87868 2.87868C6.75736 2 8.17157 2 11 2H13C15.8284 2 17.2426 2 18.1213 2.87868C19 3.75736 19 5.17157 19 8V16C19 18.8284 19 20.2426 18.1213 21.1213C17.2426 22 15.8284 22 13 22H11C8.17157 22 6.75736 22 5.87868 21.1213C5 20.2426 5 18.8284 5 16V8Z" stroke="#FFFFFF" stroke-width="1.5"/>
    <path d="M19 19.5C19.4645 19.5 19.6968 19.5 19.8911 19.4692C20.9608 19.2998 21.7998 18.4608 21.9692 17.3911C22 17.1968 22 16.9645 22 16.5V7.5C22 7.0355 22 6.80325 21.9692 6.60891C21.7998 5.53918 20.9608 4.70021 19.8911 4.53078C19.6968 4.5 19.4645 4.5 19 4.5" stroke="#FFFFFF" stroke-width="1.5"/>
    <path d="M13 14V11V8" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="11" cy="14" r="2" stroke="#FFFFFF" stroke-width="1.5"/>
    <path d="M15 10C13.8954 10 13 9.10457 13 8" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M5 19.5C4.5355 19.5 4.30325 19.5 4.10891 19.4692C3.03918 19.2998 2.20021 18.4608 2.03078 17.3911C2 17.1968 2 16.9645 2 16.5V7.5C2 7.0355 2 6.80325 2.03078 6.60891C2.20021 5.53918 3.03918 4.70021 4.10891 4.53078C4.30325 4.5 4.5355 4.5 5 4.5" stroke="#FFFFFF" stroke-width="1.5"/>
</svg>`;

let addedElement: HTMLButtonElement | null = null;
let observer: MutationObserver | null = null;

const lyricsLabel = "Lyrics";
const lyricsNotAvailableLabel = "No lyrics available";

function createButton(): HTMLButtonElement {
    // Create a the button
    const wrapper = document.createElement("button");
    wrapper.id = "oneClickLyricsButton";
    wrapper.ariaLabel = lyricsLabel;
    wrapper.title = lyricsLabel;
    wrapper.type = "button";
    wrapper.style.alignItems = "center";

    // Set the onclick action: open the song details, then click on the lyrics tab
    wrapper.addEventListener("click", () => {
        const bottomBar = document.querySelector('#footerPlayer');
        if (bottomBar) {
            (bottomBar as HTMLElement).click();
            waitForElm('[data-test="tabs-lyrics"]').then((lyricsTab) => {
                if (lyricsTab) {
                    (lyricsTab as HTMLElement).click();
                }
            });
        }
    });

    // Create the svg icon
    const lyricsIcon = document.createElement("div");
    lyricsIcon.innerHTML = icon;
    lyricsIcon.style.width = "32px";
    lyricsIcon.style.height = "32px";
    wrapper.appendChild(lyricsIcon);
    return wrapper;
};

unloads.add(() => {
    if (addedElement?.parentElement) {
        addedElement.parentElement.removeChild(addedElement);
    }
    addedElement = null;

    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

MediaItem.onMediaTransition(unloads, async (mediaItem) => {
    await toggleOneClickLyricsButton(mediaItem);
});

observer = new MutationObserver(() => {
    const container = document.querySelector("._moreContainer_f6162c8") as HTMLDivElement;
    const volumeContainer = document.querySelector("._sliderContainer_15490c0") as HTMLDivElement;
    if (!container || addedElement) return;

    addedElement = createButton();
    volumeContainer.before(addedElement);

    // On plugin load, check current song and update button state using lyrics from redux store
    const state = redux.store.getState();
    const currentTrack = state.playQueue.elements[state.playQueue.currentIndex];
    const currentTrackId = currentTrack?.mediaItemId;
    
    MediaItem.fromId(currentTrackId).then(async (mediaItem) => {
        await toggleOneClickLyricsButton(mediaItem as MediaItem);
    });
    
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

async function toggleOneClickLyricsButton(mediaItem: MediaItem) {
    const lyrics = await mediaItem.lyrics();
    const button = document.getElementById("oneClickLyricsButton") as HTMLButtonElement | null;
    if (button) {
        if (lyrics && lyrics.lyrics) {
            button.disabled = false;
            button.title = lyricsLabel;
        } else {
            button.disabled = true;
            button.title = lyricsNotAvailableLabel;
        }
    }
}

function waitForElm(selector: string): Promise<Element | null> {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
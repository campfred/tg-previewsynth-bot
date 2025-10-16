// Source : https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741
// Date : 2024-12-08

// Provides a list of supported domains
export const OdesliOrigins: string[] = [
	"https://spotify.link",
	"https://open.spotify.com",
	"https://music.apple.com",
	"https://music.youtube.com",
	"https://tidal.com",
	"https://pandora.com",
	"https://deezer.com",
	"https://soundcloud.com",
	"https://music.amazon.com",
];

// Define the Platform type as a union of string literals
export type OdesliPlatform =
	| "spotify"
	| "itunes"
	| "appleMusic"
	| "youtube"
	| "youtubeMusic"
	| "google"
	| "googleStore"
	| "pandora"
	| "deezer"
	| "tidal"
	| "amazonStore"
	| "amazonMusic"
	| "soundcloud"
	| "napster"
	| "yandex"
	| "spinrilla"
	| "audius"
	| "audiomack"
	| "anghami"
	| "boomplay";

// Define the APIProvider type as a union of string literals
export type OdesliAPIProvider = "spotify" | "itunes" | "youtube" | "google" | "pandora" | "deezer" | "tidal" | "amazon" | "soundcloud" | "napster" | "yandex" | "spinrilla" | "audius" | "audiomack" | "anghami" | "boomplay";

// Define the Response type
export interface OdesliResponse {
	// The unique ID for the input entity that was supplied in the request.
	entityUniqueId: string;

	// The userCountry query param that was supplied in the request.
	userCountry: string;

	// A URL that will render the Songlink page for this entity
	pageUrl: string;

	// A collection of objects. Each key is a platform, and each value is an object that contains data for linking to the match
	linksByPlatform: {
		[key in OdesliPlatform]?: {
			// The unique ID for this entity.
			entityUniqueId: string;

			// The URL for this match
			url: string;

			// The native app URI that can be used on mobile devices
			nativeAppUriMobile?: string;

			// The native app URI that can be used on desktop devices
			nativeAppUriDesktop?: string;
		};
	};

	// A collection of objects. Each key is a unique identifier for a streaming entity
	entitiesByUniqueId: {
		[entityUniqueId: string]: {
			// This is the unique identifier on the streaming platform/API provider
			id: string;

			// The type of the entity
			type: "song" | "album";

			title?: string;
			artistName?: string;
			thumbnailUrl?: string;
			thumbnailWidth?: number;
			thumbnailHeight?: number;

			// The API provider that powered this match
			apiProvider: OdesliAPIProvider;

			// An array of platforms that are "powered" by this entity
			platforms: OdesliPlatform[];
		};
	};
}

import { assertEquals } from "@std/assert";
import { WebLinkMap } from "./types.ts";

type TestData = {
	Map: WebLinkMap;
	Links: {
		Reduced: URL;
		Full: URL;
		Dirty: URL;
		Alternate: URL;
		AlternateDirty: URL;
		Converted: URL;
	};
};

const TestFurAffinity: TestData = {
	Map: new WebLinkMap("FurAffinity", [new URL("https://furaffinity.net/")], new URL("https://xfuraffinity.net/")),
	Links: {
		Reduced: new URL("https://furaffinity.net/view/58904471/"),
		Full: new URL("https://www.furaffinity.net/view/58904471/"),
		Dirty: new URL("https://www.furaffinity.net/view/58904471/?testy=testtest"),
		Alternate: new URL("https://sfw.furaffinity.net/view/58904471/"),
		AlternateDirty: new URL("https://sfw.furaffinity.net/view/58904471/?testy=testtest"),
		Converted: new URL("https://xfuraffinity.net/view/58904471/"),
	},
};

Deno.test("subdomainsFiltering", (): void => {
	assertEquals(WebLinkMap.filterOutSubdomains(new URL("https://www.domain.test")), new URL("https://domain.test"));
});

Deno.test("linkExpanding", async (): Promise<void> => {
	assertEquals(await WebLinkMap.expandLink(TestFurAffinity.Links.Reduced), TestFurAffinity.Links.Full);
});

Deno.test("linkCleaning", (): void => {
	assertEquals(WebLinkMap.cleanLink(TestFurAffinity.Links.Dirty), TestFurAffinity.Links.Full);
});

Deno.test("linkConversion", (): void => {
	assertEquals(TestFurAffinity.Map.convertLink(WebLinkMap.filterOutSubdomains(TestFurAffinity.Links.Full)), TestFurAffinity.Links.Converted);
});

Deno.test("linkConversionWithSubdomainsAndParams", async (): Promise<void> => {
	assertEquals(await TestFurAffinity.Map.parseLink(TestFurAffinity.Links.Alternate), TestFurAffinity.Links.Converted);
});

Deno.test(`TikTok-specific test case`, async (): Promise<void> => {
	const Map: WebLinkMap = new WebLinkMap("TikTok", [new URL("https://tiktok.com/"), new URL("https://vm.tiktok.com/")], new URL("https://vxtiktok.com/"));
	const TikTokShareLink = new URL("https://vm.tiktok.com/ZMhtQT3Yf/");
	const TikTokConvertedLink = new URL("https://vxtiktok.com/@mokastagelight/video/7427030188069883179");

	assertEquals(await Map.parseLink(TikTokShareLink), TikTokConvertedLink);
});

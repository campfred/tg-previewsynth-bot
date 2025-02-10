import { assert, assertEquals } from "@std/assert"
import { SimpleLinkConverter, SimpleLinkConverterSettings } from "./converters/simple.ts"
import { OdesliMusicConverter } from "./converters/music.ts"

type TestData = {
	Converter: SimpleLinkConverter
	Links: {
		Reduced: URL
		Full: URL
		Dirty: URL
		Alternate: URL
		AlternateDirty: URL
		Converted: URL
	}
}

const TestFurAffinity: TestData = {
	Converter: new SimpleLinkConverter("FurAffinity", [new URL("https://furaffinity.net/")], [], new URL("https://xfuraffinity.net/")),
	Links: {
		Reduced: new URL("https://furaffinity.net/view/58904471/"),
		Full: new URL("https://www.furaffinity.net/view/58904471/"),
		Dirty: new URL("https://www.furaffinity.net/view/58904471/?testy=testtest"),
		Alternate: new URL("https://sfw.furaffinity.net/view/58904471/"),
		AlternateDirty: new URL("https://sfw.furaffinity.net/view/58904471/?testy=testtest"),
		Converted: new URL("https://xfuraffinity.net/view/58904471/"),
	},
}

Deno.test("subdomainsFiltering", (): void =>
{
	assertEquals(SimpleLinkConverter.filterOutSubdomains(new URL("https://www.domain.test")), new URL("https://domain.test"))
})

Deno.test("linkExpanding", async (): Promise<void> =>
{
	assertEquals(await TestFurAffinity.Converter.expandLink(TestFurAffinity.Links.Reduced), TestFurAffinity.Links.Full)
})

Deno.test("linkCleaning", (): void =>
{
	assertEquals(TestFurAffinity.Converter.cleanLink(TestFurAffinity.Links.Dirty), TestFurAffinity.Links.Full)
})

Deno.test("linkConversion", (): void =>
{
	assertEquals(TestFurAffinity.Converter.convertLink(SimpleLinkConverter.filterOutSubdomains(TestFurAffinity.Links.Full)), TestFurAffinity.Links.Converted)
})

Deno.test("linkConversionWithSubdomainsAndParams", async (): Promise<void> =>
{
	assertEquals(await TestFurAffinity.Converter.parseLink(TestFurAffinity.Links.Alternate), TestFurAffinity.Links.Converted)
})

Deno.test("TikTok-specific test case", async (): Promise<void> =>
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("TikTok", [new URL("https://tiktok.com/"), new URL("https://vm.tiktok.com/")], [], new URL("https://vxtiktok.com/"))
	const ShareLink = new URL("https://vm.tiktok.com/ZMhtQT3Yf/")
	const ConvertedLink = new URL("https://vxtiktok.com/@mokastagelight/video/7427030188069883179")

	assertEquals(await Converter.parseLink(ShareLink), ConvertedLink)
})

Deno.test("Reddit-specific test case", async function (): Promise<void>
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("Reddit", [new URL("https://reddit.com"), new URL("https://redd.it")], [], new URL("https://rxddit.com"))
	const ShareLink = new URL("https://www.reddit.com/r/cats/s/pGdqltuTkJ")
	const ExpectedLink = new URL("https://rxddit.com/r/cats/comments/1ij688f/ill_doodle_your_cat_here_we_go/")

	const ConvertedLink: URL | null = await Converter.parseLink(ShareLink)
	assertEquals(ConvertedLink, ExpectedLink)
})

const youtubeConversionSettings: SimpleLinkConverterSettings = { expand: false, preserveSearchParams: ["v", "t"] }
Deno.test("YouTube-specific test case", async function (): Promise<void>
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTube", [new URL("https://youtube.com/watch")], [], new URL("https://yfxtube.com/watch"), youtubeConversionSettings)
	const ShareLink = new URL("https://www.youtube.com/watch?v=0yiwxIuXmdk&t=355s")
	const ExpectedLink = new URL("https://yfxtube.com/watch?v=0yiwxIuXmdk&t=355s")

	const ConvertedLink: URL | null = await Converter.parseLink(ShareLink)
	assertEquals(ConvertedLink, ExpectedLink)
})

Deno.test("YouTube-specific constraint", function (): void
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTube", [new URL("https://youtube.com/watch")], [], new URL("https://yfxtube.com/watch"), youtubeConversionSettings)
	const ShortLink = new URL("https://www.youtube.com/shorts/_r53PoMVZTQ?feature=share")

	assert(!Converter.isSupported(ShortLink))
})

Deno.test("YouTu.be-specific test case", async function ()
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTu.be", [new URL("https://youtu.be")], [], new URL("https://fxyoutu.be"), youtubeConversionSettings)
	const ShareLink = new URL("https://youtu.be/KBYvH3myqyg?t=237&si=FHSrjDGQz3-8UawQ")
	const ExpectedLink = new URL("https://fxyoutu.be/KBYvH3myqyg?t=237")

	const ConvertedLink: URL | null = await Converter.parseLink(ShareLink)
	assertEquals(ConvertedLink, ExpectedLink)
})

Deno.test("FurTrack-specific constraint", function (): void
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("FurTrack", [new URL("https://furtrack.com/p/")], [], new URL("https://furtrack.owo.lgbt/p/"))
	const NavLink = new URL("https://www.furtrack.com/index/event:furxmas2025/880404")

	assert(!Converter.isSupported(NavLink))
})

Deno.test("FurTrack-specific translation", async function (): Promise<void>
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("FurTrack", [new URL("https://furtrack.com/p/")], [new RegExp("https:\/\/www\.furtrack\.com\/index\/.+\/", "i")], new URL("https://furtrack.owo.lgbt/p/"))
	const NavLink = new URL("https://www.furtrack.com/index/event:furxmas2025/880404")
	const ConvertedLink = new URL("https://furtrack.owo.lgbt/p/880404")

	assertEquals(await Converter.parseLink(NavLink), ConvertedLink)
})

Deno.test("Music-specific test case", async (): Promise<void> =>
{
	const Converter: OdesliMusicConverter = new OdesliMusicConverter("Odesli", [new URL("https://open.spotify.com")], new URL("https://song.link"))
	const SpotifyShareLink = new URL("https://open.spotify.com/intl-fr/track/4zbInBD4rY7tYPJ16LVxdh?si=3ca28df1bfa044db")
	const OdesliConvertedLink = new URL("https://song.link/s/4zbInBD4rY7tYPJ16LVxdh")

	assertEquals(await Converter.parseLink(SpotifyShareLink), OdesliConvertedLink)
})

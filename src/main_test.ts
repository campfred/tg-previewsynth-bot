import { assert, assertEquals } from "@std/assert"
import { SimpleLinkConverter, SimpleLinkConverterSettings } from "./converters/simple.ts"
import { OdesliMusicConverter } from "./converters/music.ts"

type TestPlan = {
	Link: URL,
	Result: URL
	Converter: SimpleLinkConverter
}

Deno.test("Subdomains filtering", (): void =>
{
	assertEquals(SimpleLinkConverter.filterOutSubdomains(new URL("https://www.domain.test")), new URL("https://domain.test"))
})

const FurAffinityConverter: SimpleLinkConverter = new SimpleLinkConverter("FurAffinity", [new URL("https://furaffinity.net/")], [], [new URL("https://xfuraffinity.net/")])

Deno.test("Link expanding", async (): Promise<void> =>
{
	const Link: URL = new URL("https://furaffinity.net/view/58904471/")
	const Result: URL = new URL("https://www.furaffinity.net/view/58904471/")
	assertEquals(await FurAffinityConverter.expandLink(Link), Result)
})

Deno.test("Link cleaning", (): void =>
{
	const Link: URL = new URL("https://furaffinity.net/view/58904471/?testy=testtest")
	const Result: URL = new URL("https://furaffinity.net/view/58904471/")
	assertEquals(FurAffinityConverter.cleanLink(Link), Result)
})

Deno.test("Link conversion only", (): void =>
{
	const Link: URL = new URL("https://furaffinity.net/view/58904471/")
	const Result: URL = new URL("https://xfuraffinity.net/view/58904471/")
	assertEquals(FurAffinityConverter.convertLink(Link, FurAffinityConverter.destinations[0]), Result)
})

Deno.test("Full chain conversion", async (): Promise<void> =>
{
	const Link: URL = new URL("https://www.furaffinity.net/view/58904471/?testy=testtest")
	const Result: URL = new URL("https://xfuraffinity.net/view/58904471/")
	assertEquals(await FurAffinityConverter.parseLinkDefault(Link), Result)
})

Deno.test("TikTok-specific test case", async (): Promise<void> =>
{
	const Link: URL = new URL("https://vm.tiktok.com/ZMhtQT3Yf/")
	const Result: URL = new URL("https://vxtiktok.com/@/video/7427030188069883179")
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("TikTok", [new URL("https://tiktok.com/")], [], [new URL("https://vxtiktok.com/")])
	assertEquals(await Converter.parseLinkDefault(Link), Result)
})

Deno.test("Reddit-specific test case", async function (): Promise<void>
{
	const Link: URL = new URL("https://reddit.com/r/cats/comments/1ij688f/ill_doodle_your_cat_here_we_go/")
	const Result: URL = new URL("https://vxreddit.com/r/cats/comments/1ij688f/ill_doodle_your_cat_here_we_go/")
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("Reddit", [new URL("https://reddit.com")], [], [new URL("https://vxreddit.com")])
	assertEquals(await Converter.parseLinkDefault(Link), Result)
})

Deno.test("YouTube-specific constraint", function (): void
{
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTube", [new URL("https://youtube.com/watch")], [], [new URL("https://yfxtube.com/watch")], youtubeConversionSettings)
	const Link: URL = new URL("https://www.youtube.com/shorts/_r53PoMVZTQ?feature=share")
	assert(!Converter.isSourceSupported(Link))
})

const youtubeConversionSettings: SimpleLinkConverterSettings = { expand: false, preserveQueryParamKeys: ["v", "t"] }
Deno.test("YouTube-specific test case", async function (): Promise<void>
{
	const Link: URL = new URL("https://www.youtube.com/watch?v=0yiwxIuXmdk&t=355s")
	const Result: URL = new URL("https://yfxtube.com/watch?v=0yiwxIuXmdk&t=355s")
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTube", [new URL("https://youtube.com/watch")], [], [new URL("https://yfxtube.com/watch")], youtubeConversionSettings)
	assertEquals(await Converter.parseLinkDefault(Link), Result)
})

Deno.test("YouTu.be-specific test case", async function ()
{
	const Link: URL = new URL("https://youtu.be/KBYvH3myqyg?t=237&si=FHSrjDGQz3-8UawQ")
	const Result: URL = new URL("https://fxyoutu.be/KBYvH3myqyg?t=237")
	const Converter: SimpleLinkConverter = new SimpleLinkConverter("YouTu.be", [new URL("https://youtu.be")], [], [new URL("https://fxyoutu.be")], youtubeConversionSettings)
	assertEquals(await Converter.parseLinkDefault(Link), Result)
})

const FurTrackConverter: SimpleLinkConverter = new SimpleLinkConverter("FurTrack", [new URL("https://furtrack.com/p/")], [/^https:\/\/(www\.)?furtrack\.com\/(\w+\/)?(\w+[:/])?\w+(\(\w+\))?\//i], [new URL("https://furtrack.owo.lgbt/p/")])

Deno.test("FurTrack index translation", async function (): Promise<void>
{
	const NavLink = new URL("https://www.furtrack.com/index/character:yin_(wolf)/880404")
	const ConvertedLink = new URL("https://furtrack.owo.lgbt/p/880404")
	assertEquals(await FurTrackConverter.parseLinkDefault(NavLink), ConvertedLink)
})

Deno.test("FurTrack user favs page translation", async function (): Promise<void>
{
	const NavLink = new URL("https://www.furtrack.com/user/bark/likes/691174")
	const ConvertedLink = new URL("https://furtrack.owo.lgbt/p/691174")
	assertEquals(await FurTrackConverter.parseLinkDefault(NavLink), ConvertedLink)
})

Deno.test("FurTrack user fursuiting page translation", async function (): Promise<void>
{
	const NavLink = new URL("https://www.furtrack.com/user/bark/fursuiting/888628")
	const ConvertedLink = new URL("https://furtrack.owo.lgbt/p/888628")
	assertEquals(await FurTrackConverter.parseLinkDefault(NavLink), ConvertedLink)
})

Deno.test("FurTrack user photography page translation", async function (): Promise<void>
{
	const NavLink = new URL("https://www.furtrack.com/user/bark/photography/753398")
	const ConvertedLink = new URL("https://furtrack.owo.lgbt/p/753398")
	assertEquals(await FurTrackConverter.parseLinkDefault(NavLink), ConvertedLink)
})

Deno.test("Music-specific test case", async (): Promise<void> =>
{
	const Converter: OdesliMusicConverter = new OdesliMusicConverter("Odesli", [new URL("https://open.spotify.com")], [new URL("https://song.link")])
	const SpotifyShareLink = new URL("https://open.spotify.com/intl-fr/track/4zbInBD4rY7tYPJ16LVxdh?si=3ca28df1bfa044db")
	const OdesliConvertedLink = new URL("https://song.link/s/4zbInBD4rY7tYPJ16LVxdh")
	assertEquals(await Converter.parseLinkDefault(SpotifyShareLink), OdesliConvertedLink)
})

Deno.test("New Spotify share link test case", async (): Promise<void> =>
{
	const Converter: OdesliMusicConverter = new OdesliMusicConverter("Odesli", [new URL("https://spotify.link")], [new URL("https://song.link")])
	const SpotifyShareLink = new URL("https://spotify.link/tNTU1GlxwXb")
	const OdesliConvertedLink = new URL("https://song.link/s/544TSCvEmOhC0favdRlHuQ")
	assertEquals(await Converter.parseLinkDefault(SpotifyShareLink), OdesliConvertedLink)
})

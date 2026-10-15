import { assertEquals, assertRejects } from "@std/assert"
import { CacheManager } from "../managers/cache.ts"
import { RedirectLinkConverter } from "./redirect.ts"

const CACHE: CacheManager = CacheManager.Instance

Deno.test("Redirect converter resolves a templated URL", async () =>
{
	CACHE.clear()
	const originalFetch = globalThis.fetch
	const requestedUrls: string[] = []
	globalThis.fetch = (input: RequestInfo | URL): Promise<Response> =>
	{
		const requestUrl = new URL(input instanceof Request ? input.url : input.toString())
		requestedUrls.push(requestUrl.toString())
		const isResolverRequest = requestUrl.hostname === "resolver.test"
		const responseUrl = isResolverRequest
			? "https://album.link/s/album-id"
			: requestUrl.toString()
		return Promise.resolve({
			url: responseUrl,
			redirected: isResolverRequest,
			body: { cancel: async () => {} },
		} as unknown as Response)
	}

	try
	{
		const converter = new RedirectLinkConverter(
			"Music",
			[new URL("https://open.spotify.com/")],
			[],
			[new URL("https://song.link"), new URL("https://album.link")],
			{ redirectUrlTemplate: "https://resolver.test/{url}" },
		)
		const sourceUrl = new URL("https://open.spotify.com/track/track-id")

		assertEquals(await converter.parseLinkDefault(sourceUrl), new URL("https://album.link/s/album-id"))
		assertEquals(await converter.parseLink(sourceUrl), [new URL("https://album.link/s/album-id")])
		assertEquals(requestedUrls[1], `https://resolver.test/${ encodeURIComponent(sourceUrl.toString()) }`)
	} finally
	{
		globalThis.fetch = originalFetch
		CACHE.clear()
	}
})

Deno.test("Redirect converter rejects destinations outside its allowlist", async () =>
{
	CACHE.clear()
	const originalFetch = globalThis.fetch
	globalThis.fetch = (input: RequestInfo | URL): Promise<Response> =>
	{
		const requestUrl = new URL(input instanceof Request ? input.url : input.toString())
		const responseUrl = requestUrl.hostname === "resolver.test" ? "https://untrusted.test/item" : requestUrl.toString()
		return Promise.resolve({
			url: responseUrl,
			redirected: requestUrl.hostname === "resolver.test",
			body: { cancel: async () => {} },
		} as unknown as Response)
	}

	try
	{
		const converter = new RedirectLinkConverter(
			"Music",
			[new URL("https://open.spotify.com/")],
			[],
			[new URL("https://song.link"), new URL("https://album.link")],
			{ redirectUrlTemplate: "https://resolver.test/{url}" },
		)
		await assertRejects(
			() => converter.parseLinkDefault(new URL("https://open.spotify.com/track/track-id")),
			Error,
			"Resolver returned an unsupported destination",
		)
	} finally
	{
		globalThis.fetch = originalFetch
		CACHE.clear()
	}
})

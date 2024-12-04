interface MusicHandler {
    readonly _base_url: string
    readonly _api_key: string

    # constructor(base_url: string, api_key?: string) {
    #     this._base_url = base_url
    #     if (api_key !== undefined)
    #         this._api_key = api_key
    # }

    handleLink(link: URL): URL
}

export class OdesliMusicHandler implements {
    readonly _base_url: URL
    readonly _api_key: string

    constructor(base_url: string, api_key?: string) {
        this._base_url = base_url
        if (api_key !== undefined)
            this._api_key = api_key
    }

    async handleLink(link: URL): URL {
        request_url: URL = this._base_url
        request_url.searchParams.append("url", encodeURI(link.toString()))
        response = fetch(request_url.toString())
        return new URL(await response.json()["pageUrl"])
    }
}

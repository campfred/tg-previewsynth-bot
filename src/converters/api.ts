// TODO Implement custom API convertions

import { LinkConverter } from "../types/types.ts"

export interface APILinkConverter extends LinkConverter
{
	readonly base_url: URL
}

import { Hono } from 'hono'
import { getLanguageColor } from './langs'
import {cors} from "hono/dist/types/middleware/cors";

type Bindings = {
  LANGLEY_CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/:owner/:repo', cors(), async c => {
  // grimacing emoji
  globalThis.process = {env: c.env} as unknown as NodeJS.Process
  // end hacks for yaml

  const kv = c.env.LANGLEY_CACHE
      , owner = c.req.param('owner'), repo = c.req.param('repo')
      , cachedLangs = await kv.get(`langs:${owner}/${repo}`);
  
  let langs: Record<string, number> | null = cachedLangs && JSON.parse(cachedLangs);

  if(!langs) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: { 'User-Agent': 'langley' } })
    langs = await res.json() as Record<string, number>
    kv.put(`langs:${owner}/${repo}`, JSON.stringify(langs), { expirationTtl: 60 * 60 * 24 }) // expire in 1 day
  }

  return c.json(await Promise.all(Object.keys(langs).map(async lang => ({
    language: lang,
    amount: langs?.[lang],
    color: await getLanguageColor(kv, lang)
  }))))
})

export default app

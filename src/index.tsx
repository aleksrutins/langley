import { Hono } from 'hono'
import { getLanguageColor } from './langs'

type Bindings = {
  LANGLEY_CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/:owner/:repo', async c => {
  const kv = c.env.LANGLEY_CACHE
      , owner = c.req.param('owner'), repo = c.req.param('repo')
      , cachedLangs = await kv.get(`langs:${owner}/${repo}`);
  
  let langs: Record<string, number> | null = cachedLangs && JSON.parse(cachedLangs);

  if(!langs) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: { 'User-Agent': 'langley' } })
    langs = await res.json() as Record<string, number>
  }

  return c.json(await Promise.all(Object.keys(langs).map(async lang => ({
    language: lang,
    amount: langs?.[lang],
    color: await getLanguageColor(kv, lang)
  }))))
})

export default app

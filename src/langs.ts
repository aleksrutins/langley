import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const YAML = require('yaml')

let colors: Record<string, { color: string }> | undefined;

async function getLanguageColors(): Promise<Record<string, { color: string }>> {
    if(!colors) {
        const yamlContent = await (await fetch("https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml")).text()
        colors = YAML.parse(yamlContent)
    }

    return colors!
}

export async function getLanguageColor(kv: KVNamespace, lang: string) {
    return await kv.get(`color:${lang}`) ?? (await getLanguageColors())[lang].color
}
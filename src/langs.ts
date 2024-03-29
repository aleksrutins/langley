import YAML from 'yaml'

let colors: Record<string, { color: string }> | undefined;

async function getLanguageColors(): Promise<Record<string, { color: string }>> {
    if(!colors) {
        const yamlContent = await (await fetch("https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml")).text()
        colors = YAML.parse(yamlContent)
    }

    return colors!
}

export async function getLanguageColor(kv: KVNamespace, lang: string) {
    let color = await kv.get(`color:${lang}`)
    if(!color) {
        color = (await getLanguageColors())[lang]?.color
        if(color) kv.put(`color:${lang}`, color)
    }
    return color
}
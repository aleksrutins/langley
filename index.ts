import { request } from 'https://cdn.skypack.dev/@octokit/request?dts';
import { connect } from "https://deno.land/x/redis@v0.25.4/mod.ts";

type LanguageStatsEntry = {
    lastUpdated: number,
    languages: {
        [lang: string]: number
    }
}

const redis = await connect({
    hostname: Deno.env.get('REDISHOST') ?? '',
    port: Deno.env.get('REDISPORT'),
    name: Deno.env.get('REDISUSER'),
    password: Deno.env.get('REDISPASSWORD')
});

const server = Deno.listen({ port: parseInt(Deno.env.get('PORT') ?? '8080') });
console.log("Server running on port " + (Deno.env.get('PORT') ?? '8080'));

for await (const conn of server) {
    try {
        serveHTTP(conn);
    } catch(e) {
        console.error("An error occurred:", e);
    }
}

async function serveHTTP(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
        respond(requestEvent).catch(e => requestEvent.respondWith(new Response(e, {status: 500})));
    }
}

async function respond(req: Deno.RequestEvent) {
    const url = new URL(req.request.url);
    const match = url.pathname.match(/\/(.*?)\/(.*)/);
    if(match) {
        const entry = await redis.get(`${match[1]}/${match[2]}`);
        let date = new Date();
        date.setDate(date.getDate() - 1);
        if(entry == null || (<LanguageStatsEntry>JSON.parse(entry)).lastUpdated < date.valueOf()) {
            const stats = await request('GET /repos/{owner}/{repo}/languages', {
                owner: match[1], repo: match[2]
            });
            req.respondWith(new Response(JSON.stringify(stats.data), {status: 200, headers: {'Content-Type': 'application/json'}}));
            await redis.set(`${match[1]}/${match[2]}`, JSON.stringify(<LanguageStatsEntry>{
                lastUpdated: Date.now(),
                languages: stats.data
            }));
            return;
        }
        req.respondWith(new Response(JSON.stringify(JSON.parse(entry).languages), {status: 200, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET'
        }}));
        return;
    } else if(url.pathname == '/healthcheck') {
        req.respondWith(new Response('Working fine!', {status: 200}));
    }
    req.respondWith(new Response('404 Not Found', {status: 404}));
}
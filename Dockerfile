FROM denoland/deno:alpine-1.20.1

WORKDIR /app

USER deno

ADD . /app/

CMD ["deno", "run", "--allow-net", "--allow-env", "index.ts"]
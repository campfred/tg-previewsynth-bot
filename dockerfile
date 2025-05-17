FROM denoland/deno:alpine-2.1.9

WORKDIR /app

USER deno

COPY ["deno.*", "./"]
RUN deno task install

COPY ["src", "./src"]
RUN deno task cache

CMD [ "task", "start"]

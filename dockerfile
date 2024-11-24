FROM denoland/deno:alpine

WORKDIR /app

USER deno

COPY ["deno.*", "./"]
RUN deno task install

COPY ["*.ts", "./"]
RUN deno task cache

CMD [ "task", "start"]

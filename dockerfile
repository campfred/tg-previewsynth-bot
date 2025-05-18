FROM denoland/deno:alpine-2.3.3
ARG TARGETOS=linux
ARG TARGETARCH=x86_64

WORKDIR /app

USER deno

# COPY ["deno.*", "./"]
# RUN deno task install

# COPY ["src", "./src"]
# RUN deno task cache

# CMD [ "task", "run"]

COPY ["output\previewsynth-${TARGETOS}-${TARGETARCH}", "./previewsynth"]

CMD ["./previewsynth"]

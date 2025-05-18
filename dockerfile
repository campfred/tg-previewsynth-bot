FROM debian:12.10-slim
# Using Debian since the compiled binary uses the GNU dynamic linker (ld-linux-x86-64.so.2)
ARG TARGETOS=linux
ARG TARGETARCH=x86_64
ARG EXECUTABLE_EXTENSION

WORKDIR /app

COPY ["output/previewsynth-${TARGETOS}-${TARGETARCH}${EXECUTABLE_EXTENSION}", "/app/previewsynth"]
RUN chmod +x /app/previewsynth

ENTRYPOINT ["./previewsynth"]

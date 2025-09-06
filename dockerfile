FROM debian:13.0-slim
# Using Debian since the compiled binary uses the GNU dynamic linker
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Use the mapped architecture to copy the correct binary
COPY ["output/previewsynth-${TARGETOS}-${TARGETARCH}", "/app/previewsynth"]
RUN chmod +x /app/previewsynth

ENV NODE_ENV=production

ENTRYPOINT ["./previewsynth"]

LABEL org.opencontainers.image.source="https://github.com/campfred/tg-previewsynth-bot"
LABEL org.opencontainers.image.description="Telegram bot to automatically convert links into embed-friendly ones for Telegram. ✨"
LABEL org.opencontainers.image.license="GPL-3.0"

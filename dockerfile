FROM debian:12.10-slim
# Using Debian since the compiled binary uses the GNU dynamic linker
ARG TARGETARCH

WORKDIR /app

# Use the mapped architecture to copy the correct binary
COPY ["output/previewsynth-linux-${TARGETARCH}", "/app/previewsynth"]
RUN chmod +x /app/previewsynth

ENTRYPOINT ["./previewsynth"]

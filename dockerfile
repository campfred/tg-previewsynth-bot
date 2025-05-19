FROM debian:12.10-slim
# Using Debian since the compiled binary uses the GNU dynamic linker

ARG TARGETARCH

# Map Docker's TARGETARCH to our binary naming scheme
RUN case ${TARGETARCH} in \
	"amd64") echo "x86_64" > /tmp/arch ;; \
	"arm64") echo "aarch64" > /tmp/arch ;; \
	*) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
	esac

WORKDIR /app

# Use the mapped architecture to copy the correct binary
COPY ["output/previewsynth-linux-$(cat /tmp/arch)", "/app/previewsynth"]
RUN chmod +x /app/previewsynth

ENTRYPOINT ["./previewsynth"]

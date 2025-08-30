# Multi-stage build for C++ streaming service
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libboost-all-dev \
    libssl-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install WebSocket++ (header-only library)
RUN cd /tmp && \
    git clone https://github.com/zaphoyd/websocketpp.git && \
    cd websocketpp && \
    mkdir -p /usr/local/include/websocketpp && \
    cp -r websocketpp/* /usr/local/include/websocketpp/

# Set working directory
WORKDIR /app

# Copy source code
COPY src/ ./src/
COPY CMakeLists.txt ./

# Build the application
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc)

# Production stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libboost-filesystem1.74.0 \
    libboost-thread1.74.0 \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -r -u 999 -g daemon catchstream

# Copy binary from builder stage
COPY --from=builder /app/build/streaming_server /usr/local/bin/

# Create audio directory
RUN mkdir -p /audio/tracks && chown -R catchstream:daemon /audio

# Switch to non-root user
USER catchstream

# Expose port
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9001/health || exit 1

# Start the service
CMD ["/usr/local/bin/streaming_server"]

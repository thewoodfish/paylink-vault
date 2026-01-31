FROM rust:latest as builder

# Force cache invalidation - change this value to rebuild
ARG CACHEBUST=20260131
RUN echo "Cache bust: $CACHEBUST"

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/receiptless-backend /app/receiptless-backend
COPY migrations ./migrations

# Make binary executable
RUN chmod +x /app/receiptless-backend

# Disable output buffering for immediate logs
ENV RUST_LOG=info
ENV RUST_BACKTRACE=1

EXPOSE 8080

# Run with shell to ensure output is captured
CMD ["/bin/sh", "-c", "echo 'Container starting...' && /app/receiptless-backend"]

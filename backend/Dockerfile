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
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/receiptless-backend /app/receiptless-backend
COPY migrations ./migrations
ENV RUST_LOG=info
EXPOSE 8080
CMD ["/app/receiptless-backend"]

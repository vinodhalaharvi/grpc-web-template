.PHONY: all generate build run stop clean test-grpc local local-server local-envoy local-envoy-docker-mac help

# ============================================================================
# DOCKER TARGETS (production-like)
# ============================================================================

# Default: run everything in Docker
all: run

# Build Docker images
build:
	docker-compose build

# Run all services in Docker
run:
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo ""
	@echo "   🌐 Web UI:           http://localhost:3000"
	@echo "   🔌 Envoy (gRPC-Web): http://localhost:8080"
	@echo "   📡 gRPC Server:      localhost:50051"
	@echo "   📊 Envoy Admin:      http://localhost:9901"
	@echo ""
	@echo "   Open http://localhost:3000 in your browser!"
	@echo ""

# View logs
logs:
	docker-compose logs -f

# Stop all services
stop:
	docker-compose down

# Clean up
clean:
	docker-compose down -v
	rm -rf gen/

# ============================================================================
# LOCAL DEVELOPMENT TARGETS
# ============================================================================

# Generate Go code from protos
generate:
	buf generate

# Run gRPC server locally (for IDE development)
local-server: generate
	go mod tidy
	go run ./server

# Run Envoy locally (requires envoy installed: brew install envoy)
local-envoy:
	envoy -c envoy/envoy-local.yaml

# Run Envoy in Docker - Linux (gRPC server on localhost)
local-envoy-docker:
	@echo "Starting Envoy in Docker (Linux mode)..."
	docker run --rm -p 8080:8080 -p 9901:9901 \
		--network=host \
		-v $(PWD)/envoy/envoy-local.yaml:/etc/envoy/envoy.yaml:ro \
		envoyproxy/envoy:v1.28-latest \
		-c /etc/envoy/envoy.yaml --log-level warning

# Run Envoy in Docker - macOS (gRPC server on host)
local-envoy-docker-mac:
	@echo "Starting Envoy in Docker (macOS mode - connects to host.docker.internal)..."
	@if [ ! -f envoy/envoy-docker-mac.yaml ]; then \
		sed 's/127.0.0.1/host.docker.internal/' envoy/envoy-local.yaml > envoy/envoy-docker-mac.yaml; \
		echo "Created envoy/envoy-docker-mac.yaml"; \
	fi
	docker run --rm -p 8080:8080 -p 9901:9901 \
		-v $(PWD)/envoy/envoy-docker-mac.yaml:/etc/envoy/envoy.yaml:ro \
		envoyproxy/envoy:v1.28-latest \
		-c /etc/envoy/envoy.yaml --log-level warning

# Print local dev instructions
local:
	@echo ""
	@echo "============================================"
	@echo "  LOCAL DEVELOPMENT SETUP"
	@echo "============================================"
	@echo ""
	@echo "Run these in separate terminals:"
	@echo ""
	@echo "  Terminal 1 (gRPC server):"
	@echo "    make local-server"
	@echo ""
	@echo "  Terminal 2 (Envoy proxy - choose one):"
	@echo "    make local-envoy              # if envoy installed"
	@echo "    make local-envoy-docker-mac   # macOS with Docker"
	@echo "    make local-envoy-docker       # Linux with Docker"
	@echo ""
	@echo "  Terminal 3 (browser):"
	@echo "    open web/index.html"
	@echo ""
	@echo "============================================"
	@echo ""

# ============================================================================
# TESTING TARGETS
# ============================================================================

# Test gRPC directly (requires grpcurl: brew install grpcurl)
test-grpc:
	@echo "Testing gRPC server..."
	grpcurl -plaintext -d '{"name":"World"}' localhost:50051 hello.v1.GreeterService/SayHello

# Test streaming
test-stream:
	@echo "Testing gRPC streaming..."
	grpcurl -plaintext -d '{"name":"World"}' localhost:50051 hello.v1.GreeterService/SayHelloStream

# List available services
test-list:
	grpcurl -plaintext localhost:50051 list

# Describe service
test-describe:
	grpcurl -plaintext localhost:50051 describe hello.v1.GreeterService

# ============================================================================
# UTILITY TARGETS
# ============================================================================

# Show architecture diagram
diagram:
	@echo ""
	@echo "┌─────────────────┐     gRPC-Web      ┌─────────────────┐       gRPC       ┌─────────────────┐"
	@echo "│                 │    (HTTP/1.1)     │                 │     (HTTP/2)     │                 │"
	@echo "│     Browser     │ ───────────────▶  │      Envoy      │ ───────────────▶ │   gRPC Server   │"
	@echo "│    :3000        │                   │      :8080      │                  │     :50051      │"
	@echo "│                 │ ◀───────────────  │                 │ ◀─────────────── │                 │"
	@echo "└─────────────────┘                   └─────────────────┘                  └─────────────────┘"
	@echo ""

# Help
help:
	@echo ""
	@echo "gRPC-Web Demo - Available Commands"
	@echo "==================================="
	@echo ""
	@echo "Docker (production-like):"
	@echo "  make run        Start all services in Docker"
	@echo "  make stop       Stop all services"
	@echo "  make logs       View logs"
	@echo "  make clean      Clean up containers and generated code"
	@echo ""
	@echo "Local Development:"
	@echo "  make local              Show local dev setup instructions"
	@echo "  make generate           Generate Go code from protos"
	@echo "  make local-server       Run gRPC server locally"
	@echo "  make local-envoy        Run Envoy locally (requires install)"
	@echo "  make local-envoy-docker-mac  Run Envoy in Docker (macOS)"
	@echo "  make local-envoy-docker      Run Envoy in Docker (Linux)"
	@echo ""
	@echo "Testing (requires grpcurl):"
	@echo "  make test-grpc     Test unary RPC"
	@echo "  make test-stream   Test streaming RPC"
	@echo "  make test-list     List available services"
	@echo "  make test-describe Describe service methods"
	@echo ""
	@echo "Utility:"
	@echo "  make diagram      Show architecture diagram"
	@echo "  make help         Show this help"
	@echo ""


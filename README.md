# gRPC-Web Demo

A complete hello world example showing how browsers can call gRPC servers through Envoy.

## Architecture

```
┌─────────────────┐     gRPC-Web      ┌─────────────────┐       gRPC       ┌─────────────────┐
│                 │    (HTTP/1.1)     │                 │     (HTTP/2)     │                 │
│     Browser     │ ───────────────▶  │      Envoy      │ ───────────────▶ │   gRPC Server   │
│                 │                   │    (proxy)      │                  │      (Go)       │
│   index.html    │ ◀───────────────  │    :8080        │ ◀─────────────── │     :50051      │
│                 │                   │                 │                  │                 │
└─────────────────┘                   └─────────────────┘                  └─────────────────┘
     :3000                                                                        
```

## Why Can't Browsers Call gRPC Directly?

gRPC requires:
- HTTP/2 trailers (browsers don't expose them)
- Binary framing control (fetch API doesn't allow it)
- Long-lived HTTP/2 streams (browser limits these)

**Solution:** Envoy translates between gRPC-Web (browser-friendly) and gRPC (server-native).

## Quick Start

```bash
# Start everything with Docker
make run

# Open browser
open http://localhost:3000
```

That's it! Click "Say Hello" to call the gRPC server.

## What's Running

| Service | Port | Description |
|---------|------|-------------|
| Web UI | http://localhost:3000 | React app (single HTML file) |
| Envoy | http://localhost:8080 | gRPC-Web proxy |
| gRPC Server | localhost:50051 | Go gRPC server |
| Envoy Admin | http://localhost:9901 | Envoy dashboard |

## Project Structure

```
grpc-web-demo/
├── proto/
│   └── hello/v1/
│       └── hello.proto       # Service definition
├── server/
│   └── main.go               # gRPC server (Go)
├── envoy/
│   └── envoy.yaml            # Envoy configuration
├── web/
│   └── index.html            # React UI (single file!)
├── docker-compose.yml        # Run everything
├── Dockerfile.server         # Build gRPC server
├── buf.yaml                  # Buf configuration
└── buf.gen.yaml              # Code generation config
```

## The Proto

```protobuf
// proto/hello/v1/hello.proto

service GreeterService {
  // Simple request-response
  rpc SayHello(SayHelloRequest) returns (SayHelloResponse);
  
  // Server streaming (5 messages over 5 seconds)
  rpc SayHelloStream(SayHelloRequest) returns (stream SayHelloResponse);
}

message SayHelloRequest {
  string name = 1;
}

message SayHelloResponse {
  string message = 1;
  int32 count = 2;
}
```

## The Envoy Magic

The key part of `envoy/envoy.yaml`:

```yaml
http_filters:
  # This filter does the translation!
  - name: envoy.filters.http.grpc_web
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
```

This single filter:
- Accepts gRPC-Web requests from browsers
- Translates to native gRPC
- Forwards to backend
- Translates response back to gRPC-Web

## Testing

### From Browser
Open http://localhost:3000 and click the buttons!

### With grpcurl (direct gRPC)
```bash
# Unary call
grpcurl -plaintext localhost:50051 \
  hello.v1.GreeterService/SayHello \
  -d '{"name":"Alice"}'

# Streaming call
grpcurl -plaintext localhost:50051 \
  hello.v1.GreeterService/SayHelloStream \
  -d '{"name":"Bob"}'
```

### With curl (via Envoy)
```bash
# This won't show readable output (binary protobuf)
# but proves Envoy is working
curl -X POST http://localhost:8080/hello.v1.GreeterService/SayHello \
  -H "Content-Type: application/grpc-web+proto" \
  -H "X-Grpc-Web: 1"
```

## How gRPC-Web Works

### Request (Browser → Envoy)
```
POST /hello.v1.GreeterService/SayHello HTTP/1.1
Content-Type: application/grpc-web+proto
X-Grpc-Web: 1

[5-byte frame header][protobuf encoded message]
```

### Envoy translates to gRPC
```
POST /hello.v1.GreeterService/SayHello HTTP/2
Content-Type: application/grpc

[grpc frame header][protobuf message]
```

### Response flows back through Envoy
Envoy strips HTTP/2 trailers and encodes them in the response body.

## Local Development (without Docker)

```bash
# 1. Generate Go code
buf generate

# 2. Run gRPC server
go run ./server

# 3. Run Envoy (need to install separately)
envoy -c envoy/envoy.yaml

# 4. Open web/index.html in browser
```

## Next Steps

### Use Generated Client Code
Instead of manual protobuf encoding in the browser, generate typed clients:

```bash
# Add to buf.gen.yaml:
plugins:
  - remote: buf.build/bufbuild/es
    out: web/gen
  - remote: buf.build/connectrpc/es
    out: web/gen
```

Then in JavaScript:
```typescript
import { GreeterService } from './gen/hello/v1/hello_connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';

const transport = createGrpcWebTransport({ baseUrl: 'http://localhost:8080' });
const client = createClient(GreeterService, transport);

const response = await client.sayHello({ name: 'World' });
```

### Switch to Connect (No Envoy Needed!)
If you control the server, use Connect-Go instead of gRPC:

```go
// Connect server speaks gRPC-Web natively!
// No Envoy required!

import "connectrpc.com/connect"

mux := http.NewServeMux()
path, handler := hellov1connect.NewGreeterServiceHandler(&server{})
mux.Handle(path, handler)

// This single server handles:
// - Connect (browsers, HTTP/1.1 + JSON)
// - gRPC (services, HTTP/2 + proto)
// - gRPC-Web (browsers via Envoy, or directly!)
http.ListenAndServe(":8080", h2c.NewHandler(mux, &http2.Server{}))
```

## Cleanup

```bash
make stop   # Stop containers
make clean  # Remove everything
```

## Summary

| Component | Purpose |
|-----------|---------|
| **Proto** | Defines the API contract |
| **gRPC Server** | Implements the service (can be any language) |
| **Envoy** | Translates gRPC-Web ←→ gRPC |
| **Browser** | Calls via gRPC-Web protocol |

This pattern works with **any existing gRPC server** - you just need to add Envoy in front!
# grpc-web-template

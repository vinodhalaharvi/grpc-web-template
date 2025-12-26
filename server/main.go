package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	pb "github.com/myorg/grpc-web-demo/gen/hello/v1"
)

// Server implements the GreeterService
type Server struct {
	pb.UnimplementedGreeterServiceServer
	requestCount int32
}

// SayHello implements the unary RPC
func (s *Server) SayHello(ctx context.Context, req *pb.SayHelloRequest) (*pb.SayHelloResponse, error) {
	s.requestCount++
	name := req.Name
	if name == "" {
		name = "World"
	}

	log.Printf("SayHello called: name=%s (request #%d)", name, s.requestCount)

	return &pb.SayHelloResponse{
		Message: fmt.Sprintf("Hello, %s!", name),
		Count:   s.requestCount,
	}, nil
}

// SayHelloStream implements the server streaming RPC
func (s *Server) SayHelloStream(req *pb.SayHelloRequest, stream pb.GreeterService_SayHelloStreamServer) error {
	name := req.Name
	if name == "" {
		name = "World"
	}

	log.Printf("SayHelloStream called: name=%s", name)

	// Send 5 messages, one per second
	for i := 1; i <= 5; i++ {
		s.requestCount++
		resp := &pb.SayHelloResponse{
			Message: fmt.Sprintf("Hello #%d, %s!", i, name),
			Count:   s.requestCount,
		}

		if err := stream.Send(resp); err != nil {
			return err
		}

		log.Printf("  Sent message %d/5", i)
		time.Sleep(1 * time.Second)
	}

	return nil
}

func main() {
	port := ":50051"

	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Create gRPC server
	grpcServer := grpc.NewServer()

	// Register our service
	pb.RegisterGreeterServiceServer(grpcServer, &Server{})

	// Enable reflection (for grpcurl, debugging)
	reflection.Register(grpcServer)

	log.Printf("gRPC server listening on %s", port)
	log.Printf("")
	log.Printf("Test with grpcurl:")
	log.Printf("  grpcurl -plaintext localhost%s hello.v1.GreeterService/SayHello -d '{\"name\":\"Alice\"}'", port)
	log.Printf("")

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

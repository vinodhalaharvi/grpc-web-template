//go:build wireinject
// +build wireinject

package main

import (
	"cloud.google.com/go/firestore"
	"github.com/google/wire"

	pb "github.com/vinodhalaharvi/grpc-web-template/gen/go"
	"github.com/vinodhalaharvi/grpc-web-template/gen/go/servers"
)

func InitializeServer(client *firestore.Client, cfg *pb.ServerConfig) (*Server, error) {
	wire.Build(
		pb.RepositorySet,         // All repos + *Repositories
		servers.ServiceServerSet, // All service servers (generated)
		pb.NewServerMux,          // HTTP mux with health check
		pb.NewHTTPServer,         // HTTP server with CORS
		NewServer,                // Registers handlers
	)
	return nil, nil
}

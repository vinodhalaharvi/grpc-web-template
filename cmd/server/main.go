package main

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	"github.com/joho/godotenv"

	pb "github.com/vinodhalaharvi/grpc-web-template/gen/go"
)

func main() {
	godotenv.Load()
	ctx := context.Background()

	projectID := getEnv("FIRESTORE_PROJECT_ID", "graphql-category-db")
	port := getEnv("PORT", "8080")

	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Firestore: %v", err)
	}
	defer client.Close()

	cfg := pb.DefaultServerConfig()
	cfg.Port = port

	server, err := InitializeServer(client, cfg)
	if err != nil {
		log.Fatalf("Initialize: %v", err)
	}

	log.Printf("🚀 PureCerts on :%s (Firestore: %s)", port, projectID)
	log.Fatal(server.HTTP.ListenAndServe())
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

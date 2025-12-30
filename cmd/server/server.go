package main

import (
	"net/http"

	"github.com/vinodhalaharvi/grpc-web-template/gen/go/purecertsv1connect"
	"github.com/vinodhalaharvi/grpc-web-template/gen/go/servers"
)

// Server wraps the HTTP server
type Server struct {
	HTTP *http.Server
}

// NewServer registers all handlers and returns the server
func NewServer(
	mux *http.ServeMux,
	httpServer *http.Server,
	billingServer *servers.BillingServiceServer,
	userServer *servers.UserServiceServer,
	tenantServer *servers.TenantServiceServer,
	certServer *servers.CertificateServiceServer,
	caServer *servers.CAServiceServer,
	auditServer *servers.AuditServiceServer,
	sessionServer *servers.SessionServiceServer,
	apiKeyServer *servers.APIKeyServiceServer,
) *Server {
	// Register Connect handlers
	mux.Handle(purecertsv1connect.NewBillingServiceHandler(billingServer))
	mux.Handle(purecertsv1connect.NewUserServiceHandler(userServer))
	mux.Handle(purecertsv1connect.NewTenantServiceHandler(tenantServer))
	mux.Handle(purecertsv1connect.NewCertificateServiceHandler(certServer))
	mux.Handle(purecertsv1connect.NewCAServiceHandler(caServer))
	mux.Handle(purecertsv1connect.NewAuditServiceHandler(auditServer))
	mux.Handle(purecertsv1connect.NewSessionServiceHandler(sessionServer))
	mux.Handle(purecertsv1connect.NewAPIKeyServiceHandler(apiKeyServer))

	return &Server{HTTP: httpServer}
}

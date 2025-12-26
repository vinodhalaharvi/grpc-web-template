package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"connectrpc.com/connect"
	purecertsv1 "github.com/vinodhalaharvi/grpc-web-template/gen/go"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/vinodhalaharvi/grpc-web-template/gen/go/purecertsv1connect"
)

// =============================================================================
// HEALTH SERVICE
// =============================================================================

type HealthServer struct {
	purecertsv1connect.UnimplementedHealthServiceHandler
}

// =============================================================================
// AUTH SERVICE
// =============================================================================

type AuthServer struct {
	purecertsv1connect.UnimplementedAuthServiceHandler
}

func (s *AuthServer) Login(
	ctx context.Context,
	req *connect.Request[purecertsv1.LoginRequest],
) (*connect.Response[purecertsv1.AuthResponse], error) {
	log.Printf("Login attempt: %s", req.Msg.Email)

	return connect.NewResponse(&purecertsv1.AuthResponse{
		AccessToken:  "mock-access-token-12345",
		RefreshToken: "mock-refresh-token-67890",
		ExpiresIn:    3600,
		User: &purecertsv1.User{
			UserId:    "user-001",
			Email:     req.Msg.Email,
			FirstName: "Demo",
			LastName:  "User",
			Role:      purecertsv1.Role_ROLE_ADMIN,
			TenantId:  "tenant-001",
		},
	}), nil
}

func (s *AuthServer) Register(
	ctx context.Context,
	req *connect.Request[purecertsv1.RegisterRequest],
) (*connect.Response[purecertsv1.AuthResponse], error) {
	log.Printf("Register: %s %s (%s)", req.Msg.FirstName, req.Msg.LastName, req.Msg.Email)

	return connect.NewResponse(&purecertsv1.AuthResponse{
		AccessToken:  "mock-access-token-new",
		RefreshToken: "mock-refresh-token-new",
		ExpiresIn:    3600,
		User: &purecertsv1.User{
			UserId:    "user-002",
			Email:     req.Msg.Email,
			FirstName: req.Msg.FirstName,
			LastName:  req.Msg.LastName,
			Role:      purecertsv1.Role_ROLE_ADMIN,
			TenantId:  "tenant-001",
		},
	}), nil
}

// =============================================================================
// CERTIFICATE SERVICE
// =============================================================================

type CertificateServer struct {
	purecertsv1connect.UnimplementedCertificateServiceHandler
	certs []*purecertsv1.Certificate
}

func NewCertificateServer() *CertificateServer {
	now := time.Now()
	return &CertificateServer{
		certs: []*purecertsv1.Certificate{
			{
				CertId:        "cert-001",
				CommonName:    "api.example.com",
				SerialNumber:  "1234567890",
				IssuerCn:      "Example Root CA",
				CaId:          "ca-001",
				Status:        purecertsv1.CertificateStatus_CERTIFICATE_STATUS_ACTIVE,
				NotBefore:     timestamppb.New(now.AddDate(0, -1, 0)),
				NotAfter:      timestamppb.New(now.AddDate(1, 0, 0)),
				DaysRemaining: 365,
				Subject: &purecertsv1.Subject{
					CommonName:   "api.example.com",
					Organization: "Example Corp",
					Country:      "US",
				},
				San:                []string{"api.example.com", "*.api.example.com"},
				KeyAlgorithm:       purecertsv1.KeyAlgorithm_KEY_ALGORITHM_RSA,
				KeySize:            2048,
				SignatureAlgorithm: "SHA256WithRSA",
				Tags:               []string{"production", "api"},
				CreatedAt:          timestamppb.New(now.AddDate(0, -1, 0)),
				CreatedBy:          "admin@example.com",
			},
			{
				CertId:        "cert-002",
				CommonName:    "web.example.com",
				SerialNumber:  "0987654321",
				IssuerCn:      "Example Root CA",
				CaId:          "ca-001",
				Status:        purecertsv1.CertificateStatus_CERTIFICATE_STATUS_EXPIRING,
				NotBefore:     timestamppb.New(now.AddDate(-1, 0, 0)),
				NotAfter:      timestamppb.New(now.AddDate(0, 0, 30)),
				DaysRemaining: 30,
				Subject: &purecertsv1.Subject{
					CommonName:   "web.example.com",
					Organization: "Example Corp",
					Country:      "US",
				},
				San:                []string{"web.example.com", "www.example.com"},
				KeyAlgorithm:       purecertsv1.KeyAlgorithm_KEY_ALGORITHM_ECDSA,
				KeySize:            256,
				SignatureAlgorithm: "SHA256WithECDSA",
				Tags:               []string{"production", "web"},
				CreatedAt:          timestamppb.New(now.AddDate(-1, 0, 0)),
				CreatedBy:          "admin@example.com",
			},
			{
				CertId:        "cert-003",
				CommonName:    "old.example.com",
				SerialNumber:  "1111111111",
				IssuerCn:      "Example Root CA",
				CaId:          "ca-001",
				Status:        purecertsv1.CertificateStatus_CERTIFICATE_STATUS_EXPIRED,
				NotBefore:     timestamppb.New(now.AddDate(-2, 0, 0)),
				NotAfter:      timestamppb.New(now.AddDate(0, -1, 0)),
				DaysRemaining: 0,
				Subject: &purecertsv1.Subject{
					CommonName:   "old.example.com",
					Organization: "Example Corp",
					Country:      "US",
				},
				San:          []string{"old.example.com"},
				KeyAlgorithm: purecertsv1.KeyAlgorithm_KEY_ALGORITHM_RSA,
				KeySize:      2048,
				Tags:         []string{"deprecated"},
				CreatedAt:    timestamppb.New(now.AddDate(-2, 0, 0)),
				CreatedBy:    "admin@example.com",
			},
		},
	}
}

func (s *CertificateServer) ListCertificates(
	ctx context.Context,
	req *connect.Request[purecertsv1.ListCertificatesRequest],
) (*connect.Response[purecertsv1.ListCertificatesResponse], error) {
	log.Printf("ListCertificates: page=%d, limit=%d", req.Msg.Page, req.Msg.Limit)

	return connect.NewResponse(&purecertsv1.ListCertificatesResponse{
		Certificates: s.certs,
		Pagination: &purecertsv1.Pagination{
			Page:       1,
			Limit:      10,
			Total:      int32(len(s.certs)),
			TotalPages: 1,
		},
		Summary: &purecertsv1.CertificateSummary{
			Total:    int32(len(s.certs)),
			Active:   1,
			Expiring: 1,
			Expired:  1,
			Revoked:  0,
		},
	}), nil
}

func (s *CertificateServer) GetCertificate(
	ctx context.Context,
	req *connect.Request[purecertsv1.GetCertificateRequest],
) (*connect.Response[purecertsv1.Certificate], error) {
	log.Printf("GetCertificate: %s", req.Msg.CertId)

	for _, cert := range s.certs {
		if cert.CertId == req.Msg.CertId {
			return connect.NewResponse(cert), nil
		}
	}

	return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("certificate not found: %s", req.Msg.CertId))
}

// =============================================================================
// CA SERVICE
// =============================================================================

type CAServer struct {
	purecertsv1connect.UnimplementedCAServiceHandler
	cas []*purecertsv1.CA
}

func NewCAServer() *CAServer {
	now := time.Now()
	return &CAServer{
		cas: []*purecertsv1.CA{
			{
				CaId:   "ca-001",
				Name:   "Example Root CA",
				Type:   purecertsv1.CA_CA_TYPE_ROOT,
				Status: purecertsv1.CA_CA_STATUS_ACTIVE,
				Subject: &purecertsv1.Subject{
					CommonName:   "Example Root CA",
					Organization: "Example Corp",
					Country:      "US",
				},
				KeyAlgorithm:       purecertsv1.KeyAlgorithm_KEY_ALGORITHM_RSA,
				KeySize:            4096,
				SignatureAlgorithm: "SHA256WithRSA",
				NotBefore:          timestamppb.New(now.AddDate(-5, 0, 0)),
				NotAfter:           timestamppb.New(now.AddDate(20, 0, 0)),
				SerialNumber:       "1",
				Statistics: &purecertsv1.CAStatistics{
					CertificatesIssued:  100,
					CertificatesActive:  80,
					CertificatesRevoked: 5,
					CertificatesExpired: 15,
				},
				CreatedAt: timestamppb.New(now.AddDate(-5, 0, 0)),
			},
			{
				CaId:       "ca-002",
				Name:       "Example Intermediate CA",
				Type:       purecertsv1.CA_CA_TYPE_INTERMEDIATE,
				ParentCaId: "ca-001",
				Status:     purecertsv1.CA_CA_STATUS_ACTIVE,
				Subject: &purecertsv1.Subject{
					CommonName:   "Example Intermediate CA",
					Organization: "Example Corp",
					Country:      "US",
				},
				KeyAlgorithm:       purecertsv1.KeyAlgorithm_KEY_ALGORITHM_RSA,
				KeySize:            2048,
				SignatureAlgorithm: "SHA256WithRSA",
				NotBefore:          timestamppb.New(now.AddDate(-3, 0, 0)),
				NotAfter:           timestamppb.New(now.AddDate(10, 0, 0)),
				SerialNumber:       "2",
				Statistics: &purecertsv1.CAStatistics{
					CertificatesIssued:  50,
					CertificatesActive:  45,
					CertificatesRevoked: 2,
					CertificatesExpired: 3,
				},
				CreatedAt: timestamppb.New(now.AddDate(-3, 0, 0)),
			},
		},
	}
}

func (s *CAServer) ListCAs(
	ctx context.Context,
	req *connect.Request[purecertsv1.ListCAsRequest],
) (*connect.Response[purecertsv1.ListCAsResponse], error) {
	log.Printf("ListCAs")

	return connect.NewResponse(&purecertsv1.ListCAsResponse{
		Cas: s.cas,
		Pagination: &purecertsv1.Pagination{
			Page:       1,
			Limit:      10,
			Total:      int32(len(s.cas)),
			TotalPages: 1,
		},
	}), nil
}

func (s *CAServer) GetCA(
	ctx context.Context,
	req *connect.Request[purecertsv1.GetCARequest],
) (*connect.Response[purecertsv1.CA], error) {
	log.Printf("GetCA: %s", req.Msg.CaId)

	for _, ca := range s.cas {
		if ca.CaId == req.Msg.CaId {
			return connect.NewResponse(ca), nil
		}
	}

	return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("CA not found: %s", req.Msg.CaId))
}

// =============================================================================
// MAIN
// =============================================================================

func main() {
	mux := http.NewServeMux()

	// Register services
	healthPath, healthHandler := purecertsv1connect.NewHealthServiceHandler(&HealthServer{})
	mux.Handle(healthPath, healthHandler)

	authPath, authHandler := purecertsv1connect.NewAuthServiceHandler(&AuthServer{})
	mux.Handle(authPath, authHandler)

	certPath, certHandler := purecertsv1connect.NewCertificateServiceHandler(NewCertificateServer())
	mux.Handle(certPath, certHandler)

	caPath, caHandler := purecertsv1connect.NewCAServiceHandler(NewCAServer())
	mux.Handle(caPath, caHandler)

	// Add CORS middleware
	corsHandler := cors(mux)

	addr := ":50051"
	log.Printf("PureCerts Server listening on %s", addr)
	log.Printf("")
	log.Printf("Services:")
	log.Printf("  %s", healthPath)
	log.Printf("  %s", authPath)
	log.Printf("  %s", certPath)
	log.Printf("  %s", caPath)
	log.Printf("")
	log.Printf("Test with:")
	log.Printf("  curl -X POST http://localhost%s/purecerts.v1.HealthService/Check -H 'Content-Type: application/json' -d '{}'", addr)
	log.Printf("  curl -X POST http://localhost%s/purecerts.v1.CertificateService/ListCertificates -H 'Content-Type: application/json' -d '{}'", addr)

	err := http.ListenAndServe(addr, h2c.NewHandler(corsHandler, &http2.Server{}))
	if err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms, Grpc-Timeout, X-Grpc-Web, X-User-Agent")
		w.Header().Set("Access-Control-Expose-Headers", "Grpc-Status, Grpc-Message, Grpc-Status-Details-Bin")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

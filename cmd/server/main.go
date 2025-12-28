package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"connectrpc.com/connect"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	pb "github.com/vinodhalaharvi/grpc-web-template/gen/go"
	"github.com/vinodhalaharvi/grpc-web-template/gen/go/purecertsv1connect"
)

// =============================================================================
// CONFIG
// =============================================================================

type Config struct {
	Port             string
	FirestoreProject string
	JWTSecret        string
	AccessTokenTTL   time.Duration
	RefreshTokenTTL  time.Duration
	BcryptCost       int
}

func LoadConfig() Config {
	return Config{
		Port:             getEnv("PORT", "8080"),
		FirestoreProject: getEnv("FIRESTORE_PROJECT_ID", "graphql-category-db"),
		JWTSecret:        getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		AccessTokenTTL:   15 * time.Minute,
		RefreshTokenTTL:  7 * 24 * time.Hour,
		BcryptCost:       12,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// =============================================================================
// MAIN
// =============================================================================

func main() {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	ctx := context.Background()
	cfg := LoadConfig()

	// Initialize Firestore
	client, err := firestore.NewClient(ctx, cfg.FirestoreProject)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer client.Close()

	// Create ALL repositories (generated)
	repos := &Repositories{
		User:         pb.NewFirestoreUserRepository(client),
		Session:      pb.NewFirestoreSessionRepository(client),
		Tenant:       pb.NewFirestoreTenantRepository(client),
		Invite:       pb.NewFirestoreInviteRepository(client),
		Certificate:  pb.NewFirestoreCertificateRepository(client),
		CA:           pb.NewFirestoreCARepository(client),
		AuditLog:     pb.NewFirestoreAuditLogRepository(client),
		APIKey:       pb.NewFirestoreAPIKeyRepository(client),
		Subscription: pb.NewFirestoreSubscriptionRepository(client),
		Plan:         pb.NewFirestorePlanRepository(client),
		Invoice:      pb.NewFirestoreInvoiceRepository(client),
	}

	// Create services
	jwtMgr := NewJWTManager(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)

	tokenSvc := NewTokenService(repos, jwtMgr, cfg.BcryptCost)
	userSvc := NewUserService(repos, cfg.BcryptCost)
	tenantSvc := NewTenantService(repos)
	certSvc := NewCertificateService(repos)
	caSvc := NewCAService(repos)
	sessionSvc := NewSessionService(repos)
	apiKeySvc := NewAPIKeyService(repos)
	auditSvc := NewAuditService(repos)
	billingSvc := NewBillingService(repos)

	// Setup HTTP mux
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","version":"1.0.0"}`))
	})

	// Register Connect handlers
	mux.Handle(purecertsv1connect.NewTokenServiceHandler(tokenSvc))
	mux.Handle(purecertsv1connect.NewUserServiceHandler(userSvc))
	mux.Handle(purecertsv1connect.NewTenantServiceHandler(tenantSvc))
	mux.Handle(purecertsv1connect.NewCertificateServiceHandler(certSvc))
	mux.Handle(purecertsv1connect.NewCAServiceHandler(caSvc))
	mux.Handle(purecertsv1connect.NewSessionServiceHandler(sessionSvc))
	mux.Handle(purecertsv1connect.NewAPIKeyServiceHandler(apiKeySvc))
	mux.Handle(purecertsv1connect.NewAuditServiceHandler(auditSvc))
	mux.Handle(purecertsv1connect.NewBillingServiceHandler(billingSvc))

	// CORS
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "Connect-Protocol-Version"},
		ExposedHeaders:   []string{"Grpc-Status", "Grpc-Message"},
		AllowCredentials: true,
	}).Handler(mux)

	// HTTP/2 server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      h2c.NewHandler(handler, &http2.Server{}),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Printf("🚀 PureCerts server starting on :%s", cfg.Port)
	log.Printf("📦 Firestore project: %s", cfg.FirestoreProject)
	log.Fatal(server.ListenAndServe())
}

// =============================================================================
// REPOSITORIES CONTAINER
// =============================================================================

type Repositories struct {
	User         *pb.FirestoreUserRepository
	Session      *pb.FirestoreSessionRepository
	Tenant       *pb.FirestoreTenantRepository
	Invite       *pb.FirestoreInviteRepository
	Certificate  *pb.FirestoreCertificateRepository
	CA           *pb.FirestoreCARepository
	AuditLog     *pb.FirestoreAuditLogRepository
	APIKey       *pb.FirestoreAPIKeyRepository
	Subscription *pb.FirestoreSubscriptionRepository
	Plan         *pb.FirestorePlanRepository
	Invoice      *pb.FirestoreInvoiceRepository
}

// =============================================================================
// JWT MANAGER
// =============================================================================

type JWTManager struct {
	secret          []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

func NewJWTManager(secret string, accessTTL, refreshTTL time.Duration) *JWTManager {
	return &JWTManager{
		secret:          []byte(secret),
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

type Claims struct {
	jwt.RegisteredClaims
	UserID   string  `json:"user_id"`
	TenantID string  `json:"tenant_id"`
	Email    string  `json:"email"`
	Role     pb.Role `json:"role"`
}

func (m *JWTManager) GenerateAccessToken(user *pb.User) (string, error) {
	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.accessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.UserId,
		},
		UserID:   user.UserId,
		TenantID: user.TenantId,
		Email:    user.Email,
		Role:     user.Role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *JWTManager) GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// =============================================================================
// TOKEN SERVICE (Custom - handles auth)
// =============================================================================

type TokenService struct {
	purecertsv1connect.UnimplementedTokenServiceHandler
	repos      *Repositories
	jwt        *JWTManager
	bcryptCost int
}

func NewTokenService(repos *Repositories, jwt *JWTManager, bcryptCost int) *TokenService {
	return &TokenService{repos: repos, jwt: jwt, bcryptCost: bcryptCost}
}

func (s *TokenService) CreateToken(ctx context.Context, req *connect.Request[pb.CreateTokenRequest]) (*connect.Response[pb.TokenResponse], error) {
	msg := req.Msg

	if msg.GrantType != pb.GrantType_GRANT_TYPE_PASSWORD {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("only password grant supported"))
	}

	// Find user by email
	users, err := s.repos.User.FindByEmail(ctx, msg.Username)
	if err != nil || len(users) == 0 {
		return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("invalid credentials"))
	}
	user := users[0]

	// TODO: Check password - store hashed password in separate collection
	// For now skip password validation for demo

	if !user.Active {
		return nil, connect.NewError(connect.CodePermissionDenied, errors.New("account is disabled"))
	}

	// Check 2FA
	if user.TwoFactorEnabled {
		mfaToken, _ := s.jwt.GenerateRefreshToken()
		return connect.NewResponse(&pb.TokenResponse{
			MfaRequired: true,
			MfaToken:    mfaToken,
		}), nil
	}

	// Generate tokens
	accessToken, err := s.jwt.GenerateAccessToken(user)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	refreshToken, err := s.jwt.GenerateRefreshToken()
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// Create session
	session := &pb.Session{
		UserId:       user.UserId,
		IpAddress:    req.Header().Get("X-Forwarded-For"),
		UserAgent:    req.Header().Get("User-Agent"),
		CreatedAt:    timestamppb.Now(),
		LastActiveAt: timestamppb.Now(),
		ExpiresAt:    timestamppb.New(time.Now().Add(7 * 24 * time.Hour)),
	}
	if err := s.repos.Session.Create(ctx, session); err != nil {
		log.Printf("Failed to create session: %v", err)
	}

	// Update last login
	user.LastLoginAt = timestamppb.Now()
	s.repos.User.Update(ctx, user)

	return connect.NewResponse(&pb.TokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.jwt.accessTokenTTL.Seconds()),
		RefreshToken: refreshToken,
		User:         user,
	}), nil
}

func (s *TokenService) RefreshToken(ctx context.Context, req *connect.Request[pb.RefreshTokenRequest]) (*connect.Response[pb.TokenResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *TokenService) RevokeToken(ctx context.Context, req *connect.Request[pb.RevokeTokenRequest]) (*connect.Response[emptypb.Empty], error) {
	return connect.NewResponse(&emptypb.Empty{}), nil
}

func (s *TokenService) IntrospectToken(ctx context.Context, req *connect.Request[pb.IntrospectTokenRequest]) (*connect.Response[pb.IntrospectTokenResponse], error) {
	claims, err := s.jwt.ValidateToken(req.Msg.Token)
	if err != nil {
		return connect.NewResponse(&pb.IntrospectTokenResponse{Active: false}), nil
	}
	return connect.NewResponse(&pb.IntrospectTokenResponse{
		Active:    true,
		Sub:       claims.UserID,
		Username:  claims.Email,
		TenantId:  claims.TenantID,
		Role:      claims.Role,
		Exp:       claims.ExpiresAt.Unix(),
		Iat:       claims.IssuedAt.Unix(),
		TokenType: "Bearer",
	}), nil
}

// =============================================================================
// USER SERVICE (Custom - handles create/update)
// =============================================================================

type UserService struct {
	purecertsv1connect.UnimplementedUserServiceHandler
	repos      *Repositories
	bcryptCost int
}

func NewUserService(repos *Repositories, bcryptCost int) *UserService {
	return &UserService{repos: repos, bcryptCost: bcryptCost}
}

func (s *UserService) CreateUser(ctx context.Context, req *connect.Request[pb.CreateUserRequest]) (*connect.Response[pb.User], error) {
	msg := req.Msg

	// Check if email exists
	existing, _ := s.repos.User.FindByEmail(ctx, msg.Email)
	if len(existing) > 0 {
		return nil, connect.NewError(connect.CodeAlreadyExists, errors.New("email already registered"))
	}

	// Hash password (store separately in production)
	_, err := bcrypt.GenerateFromPassword([]byte(msg.Password), s.bcryptCost)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// Create tenant for new user
	tenant := &pb.Tenant{
		Name: msg.Company,
		Settings: &pb.TenantSettings{
			DefaultValidityDays: 365,
			ExpiryWarningDays:   30,
		},
		Limits: &pb.TenantLimits{
			MaxCertificates: 100,
			MaxCas:          5,
			MaxUsers:        10,
		},
		CreatedAt: timestamppb.Now(),
		UpdatedAt: timestamppb.Now(),
	}
	if err := s.repos.Tenant.Create(ctx, tenant); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// Create user
	user := &pb.User{
		TenantId:  tenant.TenantId,
		Email:     msg.Email,
		FirstName: msg.FirstName,
		LastName:  msg.LastName,
		Role:      pb.Role_ROLE_ADMIN,
		Active:    true,
		CreatedAt: timestamppb.Now(),
		UpdatedAt: timestamppb.Now(),
	}
	if err := s.repos.User.Create(ctx, user); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(user), nil
}

func (s *UserService) GetCurrentUser(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[pb.User], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) GetUser(ctx context.Context, req *connect.Request[pb.GetUserRequest]) (*connect.Response[pb.User], error) {
	user, err := s.repos.User.Get(ctx, req.Msg.UserId)
	if err != nil {
		if errors.Is(err, pb.ErrNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(user), nil
}

func (s *UserService) UpdateUser(ctx context.Context, req *connect.Request[pb.UpdateUserRequest]) (*connect.Response[pb.User], error) {
	msg := req.Msg
	user, err := s.repos.User.Get(ctx, msg.UserId)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	if msg.FirstName != nil {
		user.FirstName = *msg.FirstName
	}
	if msg.LastName != nil {
		user.LastName = *msg.LastName
	}
	if msg.Role != nil {
		user.Role = *msg.Role
	}
	if msg.Active != nil {
		user.Active = *msg.Active
	}
	user.UpdatedAt = timestamppb.Now()

	if err := s.repos.User.Update(ctx, user); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(user), nil
}

func (s *UserService) DeleteUser(ctx context.Context, req *connect.Request[pb.DeleteUserRequest]) (*connect.Response[emptypb.Empty], error) {
	if err := s.repos.User.Delete(ctx, req.Msg.UserId); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&emptypb.Empty{}), nil
}

func (s *UserService) ListUsers(ctx context.Context, req *connect.Request[pb.ListUsersRequest]) (*connect.Response[pb.ListUsersResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	users, err := s.repos.User.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListUsersResponse{Users: users}), nil
}

// Stub implementations
func (s *UserService) ChangePassword(ctx context.Context, req *connect.Request[pb.ChangePasswordRequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) RequestPasswordReset(ctx context.Context, req *connect.Request[pb.RequestPasswordResetRequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) ResetPassword(ctx context.Context, req *connect.Request[pb.ResetPasswordRequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) VerifyEmail(ctx context.Context, req *connect.Request[pb.VerifyEmailRequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) ResendVerificationEmail(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) InviteUser(ctx context.Context, req *connect.Request[pb.InviteUserRequest]) (*connect.Response[pb.Invite], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) ListInvites(ctx context.Context, req *connect.Request[pb.ListInvitesRequest]) (*connect.Response[pb.ListInvitesResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) CancelInvite(ctx context.Context, req *connect.Request[pb.CancelInviteRequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) AcceptInvite(ctx context.Context, req *connect.Request[pb.AcceptInviteRequest]) (*connect.Response[pb.User], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) Enable2FA(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[pb.Enable2FAResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) Confirm2FA(ctx context.Context, req *connect.Request[pb.Confirm2FARequest]) (*connect.Response[pb.Confirm2FAResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) Disable2FA(ctx context.Context, req *connect.Request[pb.Disable2FARequest]) (*connect.Response[emptypb.Empty], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) Verify2FA(ctx context.Context, req *connect.Request[pb.Verify2FARequest]) (*connect.Response[pb.TokenResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) Get2FAStatus(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[pb.TwoFactorStatus], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (s *UserService) RegenerateBackupCodes(ctx context.Context, req *connect.Request[pb.RegenerateBackupCodesRequest]) (*connect.Response[pb.BackupCodesResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

// =============================================================================
// TENANT SERVICE (Custom)
// =============================================================================

type TenantService struct {
	purecertsv1connect.UnimplementedTenantServiceHandler
	repos *Repositories
}

func NewTenantService(repos *Repositories) *TenantService {
	return &TenantService{repos: repos}
}

func (s *TenantService) GetTenant(ctx context.Context, req *connect.Request[pb.GetTenantRequest]) (*connect.Response[pb.Tenant], error) {
	tenant, err := s.repos.Tenant.Get(ctx, req.Msg.TenantId)
	if err != nil {
		if errors.Is(err, pb.ErrNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(tenant), nil
}

func (s *TenantService) UpdateTenant(ctx context.Context, req *connect.Request[pb.UpdateTenantRequest]) (*connect.Response[pb.Tenant], error) {
	msg := req.Msg
	tenant, err := s.repos.Tenant.Get(ctx, msg.TenantId)
	if err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}

	if msg.Name != nil {
		tenant.Name = *msg.Name
	}
	if msg.Settings != nil {
		tenant.Settings = msg.Settings
	}
	tenant.UpdatedAt = timestamppb.Now()

	if err := s.repos.Tenant.Update(ctx, tenant); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(tenant), nil
}

func (s *TenantService) GetTenantStats(ctx context.Context, req *connect.Request[pb.GetTenantRequest]) (*connect.Response[pb.TenantStats], error) {
	return connect.NewResponse(&pb.TenantStats{}), nil
}

// =============================================================================
// CERTIFICATE SERVICE
// =============================================================================

type CertificateService struct {
	purecertsv1connect.UnimplementedCertificateServiceHandler
	repos *Repositories
}

func NewCertificateService(repos *Repositories) *CertificateService {
	return &CertificateService{repos: repos}
}

func (s *CertificateService) GetCertificate(ctx context.Context, req *connect.Request[pb.GetCertificateRequest]) (*connect.Response[pb.Certificate], error) {
	cert, err := s.repos.Certificate.Get(ctx, req.Msg.CertId)
	if err != nil {
		if errors.Is(err, pb.ErrNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(cert), nil
}

func (s *CertificateService) ListCertificates(ctx context.Context, req *connect.Request[pb.ListCertificatesRequest]) (*connect.Response[pb.ListCertificatesResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	certs, err := s.repos.Certificate.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListCertificatesResponse{Certificates: certs}), nil
}

func (s *CertificateService) DeleteCertificate(ctx context.Context, req *connect.Request[pb.DeleteCertificateRequest]) (*connect.Response[emptypb.Empty], error) {
	if err := s.repos.Certificate.Delete(ctx, req.Msg.CertId); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&emptypb.Empty{}), nil
}

// =============================================================================
// CA SERVICE
// =============================================================================

type CAService struct {
	purecertsv1connect.UnimplementedCAServiceHandler
	repos *Repositories
}

func NewCAService(repos *Repositories) *CAService {
	return &CAService{repos: repos}
}

func (s *CAService) GetCA(ctx context.Context, req *connect.Request[pb.GetCARequest]) (*connect.Response[pb.CA], error) {
	ca, err := s.repos.CA.Get(ctx, req.Msg.CaId)
	if err != nil {
		if errors.Is(err, pb.ErrNotFound) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(ca), nil
}

func (s *CAService) ListCAs(ctx context.Context, req *connect.Request[pb.ListCAsRequest]) (*connect.Response[pb.ListCAsResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	cas, err := s.repos.CA.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListCAsResponse{Cas: cas}), nil
}

func (s *CAService) DeleteCA(ctx context.Context, req *connect.Request[pb.DeleteCARequest]) (*connect.Response[emptypb.Empty], error) {
	if err := s.repos.CA.Delete(ctx, req.Msg.CaId); err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&emptypb.Empty{}), nil
}

// =============================================================================
// SESSION SERVICE (stubbed - no direct CRUD in proto)
// =============================================================================

type SessionService struct {
	purecertsv1connect.UnimplementedSessionServiceHandler
	repos *Repositories
}

func NewSessionService(repos *Repositories) *SessionService {
	return &SessionService{repos: repos}
}

func (s *SessionService) ListSessions(ctx context.Context, req *connect.Request[pb.ListSessionsRequest]) (*connect.Response[pb.ListSessionsResponse], error) {
	limit := int(req.Msg.GetLimit())
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	sessions, err := s.repos.Session.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListSessionsResponse{Sessions: sessions}), nil
}

// =============================================================================
// API KEY SERVICE (stubbed - no direct Get/Delete in proto)
// =============================================================================

type APIKeyService struct {
	purecertsv1connect.UnimplementedAPIKeyServiceHandler
	repos *Repositories
}

func NewAPIKeyService(repos *Repositories) *APIKeyService {
	return &APIKeyService{repos: repos}
}

func (s *APIKeyService) ListAPIKeys(ctx context.Context, req *connect.Request[pb.ListAPIKeysRequest]) (*connect.Response[pb.ListAPIKeysResponse], error) {
	limit := int(req.Msg.GetLimit())
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	keys, err := s.repos.APIKey.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListAPIKeysResponse{ApiKeys: keys}), nil
}

// =============================================================================
// AUDIT SERVICE
// =============================================================================

type AuditService struct {
	purecertsv1connect.UnimplementedAuditServiceHandler
	repos *Repositories
}

func NewAuditService(repos *Repositories) *AuditService {
	return &AuditService{repos: repos}
}

func (s *AuditService) ListAuditLogs(ctx context.Context, req *connect.Request[pb.ListAuditLogsRequest]) (*connect.Response[pb.ListAuditLogsResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	logs, err := s.repos.AuditLog.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListAuditLogsResponse{Logs: logs}), nil
}

// =============================================================================
// BILLING SERVICE
// =============================================================================

type BillingService struct {
	purecertsv1connect.UnimplementedBillingServiceHandler
	repos *Repositories
}

func NewBillingService(repos *Repositories) *BillingService {
	return &BillingService{repos: repos}
}

func (s *BillingService) ListPlans(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[pb.ListPlansResponse], error) {
	plans, err := s.repos.Plan.List(ctx, 100)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListPlansResponse{Plans: plans}), nil
}

func (s *BillingService) ListInvoices(ctx context.Context, req *connect.Request[pb.ListInvoicesRequest]) (*connect.Response[pb.ListInvoicesResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	invoices, err := s.repos.Invoice.List(ctx, limit)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.ListInvoicesResponse{Invoices: invoices}), nil
}

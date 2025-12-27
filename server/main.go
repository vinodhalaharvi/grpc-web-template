package main

import (
	context "context"

	connect "connectrpc.com/connect"
	_go "github.com/vinodhalaharvi/grpc-web-template/gen/go"
	"google.golang.org/protobuf/types/known/emptypb"
)

// HealthServer implements purecertsv1connect.HealthServiceHandler
type HealthServer struct {
}

func (h HealthServer) Check(ctx context.Context, c *connect.Request[_go.HealthCheckRequest]) (*connect.Response[_go.HealthCheckResponse], error) {

	//TODO implement me
	panic("implement me")
}

func (h HealthServer) Ready(ctx context.Context, c *connect.Request[_go.ReadinessCheckRequest]) (*connect.Response[_go.ReadinessCheckResponse], error) {
	//TODO implement me
	panic("implement me")
}

type BillingServer struct {
}

func (b BillingServer) GetSubscription(ctx context.Context, c *connect.Request[emptypb.Empty]) (*connect.Response[_go.Subscription], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) ListPlans(ctx context.Context, c *connect.Request[emptypb.Empty]) (*connect.Response[_go.ListPlansResponse], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) CreateCheckoutSession(ctx context.Context, c *connect.Request[_go.CreateCheckoutSessionRequest]) (*connect.Response[_go.CheckoutSession], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) GetBillingPortalUrl(ctx context.Context, c *connect.Request[emptypb.Empty]) (*connect.Response[_go.BillingPortalUrl], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) GetUsage(ctx context.Context, c *connect.Request[emptypb.Empty]) (*connect.Response[_go.Usage], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) ListInvoices(ctx context.Context, c *connect.Request[_go.ListInvoicesRequest]) (*connect.Response[_go.ListInvoicesResponse], error) {
	//TODO implement me
	panic("implement me")
}

func (b BillingServer) GetInvoice(ctx context.Context, c *connect.Request[_go.GetInvoiceRequest]) (*connect.Response[_go.Invoice], error) {
	//TODO implement me
	panic("implement me")
}

func main() {

}

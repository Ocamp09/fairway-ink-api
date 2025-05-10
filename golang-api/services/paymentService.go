package services

import (
	"errors"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

type MockPaymentService struct {
	MockCreatePaymentIntent func(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error)
}

// CreatePaymentIntent calls the mock function or returns an error if not set
func (m *MockPaymentService) CreatePaymentIntent(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error) {
	if m.MockCreatePaymentIntent != nil {
		return m.MockCreatePaymentIntent(params)
	}
	return nil, errors.New("mock CreatePaymentIntent function not implemented")
}

type PaymentService interface {
	CreatePaymentIntent(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error)
}

type StripePaymentService struct{}

func (s *StripePaymentService) CreatePaymentIntent(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error) {
	return paymentintent.New(params)
}
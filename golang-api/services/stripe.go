package services

import (
	"fmt"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

type StripeService interface {
	GetPaymentIntent(id string) (*stripe.PaymentIntent, error)
	CapturePaymentIntent(id string) (*stripe.PaymentIntent, error)
}

type stripeService struct{}

func NewStripeService(key string) StripeService {
	stripe.Key = key
	return &stripeService{}
}

func (s *stripeService) GetPaymentIntent(id string) (*stripe.PaymentIntent, error) {
	intent, err := paymentintent.Get(id, nil)
	if err != nil {
		return nil, fmt.Errorf("error getting payment intent: %w", err)
	}
	return intent, nil
}

func (s *stripeService) CapturePaymentIntent(id string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentCaptureParams{}
	intent, err := paymentintent.Capture(id, params)
	if err != nil {
		return nil, fmt.Errorf("error capturing payment intent: %w", err)
	}
	return intent, nil
}

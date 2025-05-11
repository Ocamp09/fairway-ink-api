package services

import (
	"fmt"

	"github.com/ocamp09/fairway-ink-api/golang-api/structs"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

const (
	SOLID_PRICE  = 599
	TEXT_PRICE   = 599
	CUSTOM_PRICE = 799 
)

type StripeServiceImpl struct {}

func NewStripeService(key string) StripeService {
	stripe.Key = key
	return &StripeServiceImpl{}
}

// CreatePaymentIntent calls the mock function or returns an error if not set
func (s *StripeServiceImpl) CreatePaymentIntent(cart []structs.CartItem) (*stripe.PaymentIntent, error) {
	// Prepare line items
	totalAmount := 0

	for _, item := range cart {
		if item.Quantity <= 0  {
			return nil, fmt.Errorf("invalid cart item: missing positive quantity")
		}

		var price int
		switch item.TemplateType {
		case "solid":
			price = SOLID_PRICE
		case "text":
			price = TEXT_PRICE
		case "custom":
			price = CUSTOM_PRICE
		default:
			return nil, fmt.Errorf("invalid item type in cart")
		}

		totalAmount += price * int(item.Quantity)
	}

	params := &stripe.PaymentIntentParams{
		Amount: stripe.Int64(int64(totalAmount)),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		PaymentMethodTypes: []*string{stripe.String("card")},
		CaptureMethod: stripe.String(string(stripe.PaymentIntentCaptureMethodManual)),
	}

	
	return paymentintent.New(params)
}

func (s *StripeServiceImpl) GetPaymentIntent(id string) (*stripe.PaymentIntent, error) {
	intent, err := paymentintent.Get(id, nil)
	if err != nil {
		return nil, fmt.Errorf("error getting payment intent: %w", err)
	}
	return intent, nil
}

func (s *StripeServiceImpl) CapturePaymentIntent(id string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentCaptureParams{}
	intent, err := paymentintent.Capture(id, params)
	if err != nil {
		return nil, fmt.Errorf("error capturing payment intent: %w", err)
	}
	return intent, nil
}

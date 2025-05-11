package services

import (
	"io"

	"github.com/EasyPost/easypost-go/v4"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stripe/stripe-go/v75"
)

type CartService interface {
	InsertCartItem(item structs.CartItem) error
}

type GenerateStlService interface {
	GenerateStl(ssid string, stlKey string, file io.Reader, filename string, scale string) (string, error)
}

type DesignService interface {
	ListDesigns() ([]string, error)
	GetFilePath(filename string) string
	FileExists(path string) bool
}

type OrderService interface {
	ProcessOrder(orderInfo *structs.OrderInfo) (structs.OrderInfo, error)
}

type EasyPostClient interface {
	CreateShipment(shipment *easypost.Shipment) (*easypost.Shipment, error)
	LowestShipmentRate(shipment *easypost.Shipment) (*easypost.Rate, error)
	BuyShipment(shipmentID string, rate *easypost.Rate, insurance string) (*easypost.Shipment, error)
}

type StripeService interface {
	CreatePaymentIntent(cart []structs.CartItem) (*stripe.PaymentIntent, error)
	GetPaymentIntent(id string) (*stripe.PaymentIntent, error)
	CapturePaymentIntent(id string) (*stripe.PaymentIntent, error)
}
package services

import (
	"io"

	"github.com/EasyPost/easypost-go/v4"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stripe/stripe-go/v75"
)

type CartService interface {
	InsertCartItem(item structs.CartItem) error
}

type GenerateStlService interface {
	GenerateStl(ssid string, stlKey string, file io.Reader, filename string, scale string, stlName string) (string, error)
}

type DesignService interface {
	ListDesigns() ([]structs.Design, error)
	GetFilePath(filename string, ssid string) string
	FileExists(path string) bool
}

type S3API interface {
	ListObjectsV2(input *s3.ListObjectsV2Input) (*s3.ListObjectsV2Output, error)
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
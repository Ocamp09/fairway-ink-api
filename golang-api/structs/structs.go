package structs

import "github.com/EasyPost/easypost-go/v4"

type OrderInfo struct {
	PaymentIntentID string  `json:"intent_id"`
	BrowserSSID     string  `json:"browser_ssid"`
	Amount          float32 `json:"amount"`
	PaymentStatus   string  `json:"payment_status"`
	Name            string  `json:"name"`
	Email           string  `json:"email"`
	Address         struct {
		Line1      string `json:"line1"`
		Line2      string `json:"line2"`
		City       string `json:"city"`
		State      string `json:"state"`
		PostalCode string `json:"postal_code"`
		Country    string `json:"country"`
	}
	ShippingInfo ShippingInfo `json:"shipping_info"`
}

type ShippingInfo struct {
	TrackingNumber    string           `json:"tracking_id"`
	ToAddress         easypost.Address `json:"to_address"`
	Carrier           string           `json:"carrier"`
	EstimatedDelivery int              `json:"expected_delivery"`
}

type CartItem struct {
	SSID         string `json:"ssid" binding:"required"`
	StlURL       string `json:"stlUrl" binding:"required"`
	Quantity     int    `json:"quantity" binding:"required"`
	TemplateType string `json:"templateType" binding:"required"`
}
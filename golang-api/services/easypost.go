package services

import (
	"github.com/EasyPost/easypost-go/v4"
)

type EasyPostClientImpl struct {
	client *easypost.Client
}

func NewEasyPostClient(apiKey string) EasyPostClient {
	return &EasyPostClientImpl{
		client: easypost.New(apiKey),
	}
}

func (e *EasyPostClientImpl) CreateShipment(shipment *easypost.Shipment) (*easypost.Shipment, error) {
	return e.client.CreateShipment(shipment)
}

func (e *EasyPostClientImpl) LowestShipmentRate(shipment *easypost.Shipment) (*easypost.Rate, error) {
	rate, err := e.client.LowestShipmentRate(shipment)
	if err != nil {
		return nil, err
	}
	return &rate, nil
}

func (e *EasyPostClientImpl) BuyShipment(shipmentID string, rate *easypost.Rate, insurance string) (*easypost.Shipment, error) {
	return e.client.BuyShipment(shipmentID, rate, insurance)
}

package services

import (
	"io"

	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"go.uber.org/zap"
)

type CartService interface {
	InsertCartItem(item structs.CartItem) error
}

type GenerateStlService interface {
	GenerateStl(ssid string, file io.Reader, filename string, scale string, logger *zap.SugaredLogger) (string, error)
	CleanOldSTL(ssid string, stlKey string, filename string) error
}
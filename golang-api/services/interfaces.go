package services

import "github.com/ocamp09/fairway-ink-api/golang-api/structs"

type CartService interface {
	InsertCartItem(item structs.CartItem) error
}
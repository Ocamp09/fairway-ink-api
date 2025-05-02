package services

import (
	"database/sql"
	"fmt"

	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
)

type CartServiceImpl struct {
	DB *sql.DB
}

func NewCartService(db *sql.DB) CartService {
	return &CartServiceImpl{DB: db}
}

func (cs *CartServiceImpl) InsertCartItem(item structs.CartItem) error {
	tx, err := cs.DB.Begin()
	if err != nil {
		return fmt.Errorf("transaction failed: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `INSERT INTO cart_items (browser_ssid, stl_url, quantity, template_type) VALUES (?, ?, ?, ?)`
	_, err = tx.Exec(query, item.SSID, item.StlURL, item.Quantity, item.TemplateType)
	if err != nil {
		return fmt.Errorf("insert failed: %w", err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("commit failed: %w", err)
	}

	return nil
}

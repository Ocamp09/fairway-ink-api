CREATE DATABASE fairway_ink;
USE fairway_ink;

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    purchaser_email VARCHAR(255) NOT NULL,
    stl_link VARCHAR(500) NOT NULL,
    browser_ssid VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(15) NOT NULL,
    purchase_amount DECIMAL(10, 2) NOT NULL,
    stripe_ssid VARCHAR(255) NOT NULL UNIQUE,
    payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
    shipping_status ENUM('pending', 'shipped', 'delivered') NOT NULL DEFAULT 'pending',
);

USE fairway_ink;

CREATE TABLE orders (
    order_id       INT AUTO_INCREMENT PRIMARY KEY,
    purchaser_email VARCHAR(255) NOT NULL,
    purchaser_name VARCHAR(255),
    browser_ssid VARCHAR(255) NOT NULL,
    stripe_ssid VARCHAR(255) UNIQUE NOT NULL,
    total_amount   DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stl_files (
    stl_id         INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    s3_url         VARCHAR(2083) NOT NULL,
    file_name VARCHAR(15) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE print_queue (
    print_id       INT AUTO_INCREMENT PRIMARY KEY,
    stl_id         INT NOT NULL,
    printer_id     VARCHAR(50),
    status         ENUM('queued', 'printing', 'completed', 'failed') DEFAULT 'queued',
    estimated_completion_time TIMESTAMP,
    started_at     TIMESTAMP NULL,
    completed_at   TIMESTAMP NULL,
    FOREIGN KEY (stl_id) REFERENCES stl_files(stl_id) ON DELETE CASCADE
);

CREATE TABLE shipping (
    shipment_id    INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    tracking_number VARCHAR(255) UNIQUE NOT NULL,
    shipping_label_url VARCHAR(2083),
    shipping_status ENUM('pending', 'shipped', 'delivered') DEFAULT 'pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE financials (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    stripe_ssid VARCHAR(255) UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    fees          DECIMAL(10,2) NOT NULL,
    net_revenue   DECIMAL(10,2) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);



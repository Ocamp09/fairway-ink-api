
CREATE TABLE cart_items (
    id  INT AUTO_INCREMENT PRIMARY KEY,
    browser_ssid VARCHAR(255) NOT NULL,
    stl_url VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    template_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id       INT AUTO_INCREMENT PRIMARY KEY,
    purchaser_email VARCHAR(255) NOT NULL,
    purchaser_name VARCHAR(255),
    address_1 VARCHAR(255) NOT NULL,
    address_2 VARCHAR(255) NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    zipcode VARCHAR(15) NOT NULL,
    country VARCHAR(2) NOT NULL,
    browser_ssid VARCHAR(255) NOT NULL,
    stripe_ssid VARCHAR(255) UNIQUE NOT NULL,
    total_amount   DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE print_jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status         ENUM('queued', 'printing', 'completed', 'failed') DEFAULT 'queued',
    estimated_completion_time INT NULL,
    started_at     TIMESTAMP NULL,
    completed_at   TIMESTAMP NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE stl_files (
    stl_id         INT AUTO_INCREMENT PRIMARY KEY,
    browser_ssid       VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    job_id INT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES print_jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE shipping (
    shipment_id    INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    easypost_id VARCHAR(255) NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    service VARCHAR(255) NOT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    ship_rate VARCHAR(15) NOT NULL,
    shipping_label_url VARCHAR(2083),
    shipping_status ENUM('pending', 'shipped', 'delivered') DEFAULT 'pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE financials (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    stripe_ssid    VARCHAR(255) UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    fees          DECIMAL(10,2) NOT NULL,
    net_revenue   DECIMAL(10,2) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (stripe_ssid) REFERENCES orders(stripe_ssid) ON DELETE CASCADE

);

CREATE TABLE designs (
    design_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

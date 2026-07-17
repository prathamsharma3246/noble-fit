-- ============================================================
-- NOBLE FIT — MySQL Database Schema
-- Import this in phpMyAdmin (XAMPP) to create everything at once.
-- ============================================================

CREATE DATABASE IF NOT EXISTS noble_fit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE noble_fit;

-- ------------------------------------------------------------
-- Admin login (for the admin panel)
-- ------------------------------------------------------------
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default login -> username: admin | password: admin123
-- CHANGE THIS PASSWORD after your first login (Admin Panel > Change Password).
INSERT INTO admin_users (username, password_hash) VALUES
('admin', '$2y$10$V1xS5L8t9ZBzVlrKSpdLmeSI/GLMNpFZUwrZ./SSh94xSrfiOAMza');

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category ENUM('tshirts','shirts','denims','pants') NOT NULL,
    is_new TINYINT(1) DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    orig_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    affiliate_link VARCHAR(500) DEFAULT NULL, -- Amazon affiliate URL for this product ("Buy on Amazon" button)
    rating DECIMAL(2,1) DEFAULT 4.5,
    rating_count INT DEFAULT 0,
    stock_status ENUM('in_stock','out_of_stock') DEFAULT 'in_stock',
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed with your existing 12 products so the site isn't empty on first load
-- NOTE: affiliate_link is left blank here — add your real Amazon affiliate URLs
-- for each product from the admin panel (Products > Edit).
INSERT INTO products (name, category, is_new, price, orig_price, image_url, affiliate_link, rating, rating_count, sort_order) VALUES
('Premium White Polo T-Shirt',                 'tshirts', 0, 800,  1000, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/T-Shirt_uf3crf', NULL, 4.5, 128, 1),
('Premium Dark Green Polo T-Shirt',             'tshirts', 0, 800,  1000, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/images_hfif7a', NULL, 4.5, 128, 2),
('Premium Navy Blue Polo T-Shirt',              'tshirts', 0, 800,  1000, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Navy_Blue_Polo_T-Shirt_jsuzgj', NULL, 4.5, 128, 3),
('Premium Olive Green Polo T-Shirt',            'tshirts', 1, 800,  1000, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Olive_Green_Polo_T-Shirt_msgjza', NULL, 4.5, 128, 4),
('Premium Red and White Striped Shirt',         'shirts',  0, 999,  1200, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Striped_Shirt_a8zpf6', NULL, 5.0, 140, 5),
('Premium Blue Striped Panel Casual Shirt',     'shirts',  0, 1170, 1300, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Blue_Striped_Panel_Casual_Shirt_icbqb9', NULL, 5.0, 140, 6),
('Premium Navy Blue Striped Band Collar Shirt', 'shirts',  1, 1020, 1200, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Navy_Blue_Striped_Band_collar_Shirt_gf2mqw', NULL, 5.0, 140, 7),
('Premium Sky Blue Striped Casual Shirt',       'shirts',  0, 1118, 1300, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Sky_Blue_Striped_Casual_Shirt_o8kjdj', NULL, 5.0, 140, 8),
('Premium Linen Pants',                         'pants',   0, 1105, 1300, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Linen_Pants_h6ujyz', NULL, 5.0, 84, 9),
('Premium Denim Jeans',                         'denims',  0, 1520, 1600, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Denim_Jeans_ax3knb', NULL, 4.5, 95, 10),
('Straight Fit Jeans',                          'denims',  1, 1344, 1600, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/straight_fit_jeans_iqooyj', NULL, 5.0, 63, 11),
('Light Wash Jeans',                            'denims',  1, 1410, 1500, 'https://res.cloudinary.com/dn3waiq5c/image/upload/f_auto,q_auto/Light_Wash_Jeans_xanist', NULL, 4.5, 95, 12);

-- ------------------------------------------------------------
-- Coupons
-- ------------------------------------------------------------
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    discount_type ENUM('percent','flat') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2) DEFAULT NULL, -- caps a % discount; NULL = no cap
    usage_limit INT DEFAULT NULL,            -- NULL = unlimited
    used_count INT DEFAULT 0,
    expiry_date DATE DEFAULT NULL,           -- NULL = never expires
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- One sample coupon so you can test immediately: NOBLE10 = 10% off, capped at ₹300
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expiry_date) VALUES
('NOBLE10', 'percent', 10, 500, 300, NULL, NULL);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(40) DEFAULT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    size VARCHAR(10) NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Contact + Newsletter
-- ------------------------------------------------------------
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(15),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE newsletter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

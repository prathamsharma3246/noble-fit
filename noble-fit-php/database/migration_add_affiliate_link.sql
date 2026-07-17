-- ============================================================
-- NOBLE FIT — MIGRATION: add affiliate_link to products
-- ============================================================
-- Run this ONCE in phpMyAdmin (SQL tab, with `noble_fit` selected) if you
-- already have a working database from before and don't want to re-import
-- the whole schema.sql (which would wipe your existing products/orders).
--
-- Safe to run even if some products already exist — it only adds a column.
-- ============================================================

USE noble_fit;

ALTER TABLE products
    ADD COLUMN affiliate_link VARCHAR(500) DEFAULT NULL
    AFTER image_url;

-- After running this, go to Admin Panel > Products > Edit each product
-- and paste its Amazon affiliate URL into the new "Amazon Affiliate Link" field.

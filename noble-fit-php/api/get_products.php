<?php
require_once __DIR__ . '/config.php';
$db = getDb();

$result = $db->query("SELECT id, name, category, is_new, price, orig_price, image_url, affiliate_link, rating, rating_count, stock_status
                       FROM products
                       WHERE is_active = 1
                       ORDER BY sort_order ASC, id DESC");

$products = [];
while ($row = $result->fetch_assoc()) {
    $row['id']             = (int)$row['id'];
    $row['is_new']         = (bool)$row['is_new'];
    $row['price']          = (float)$row['price'];
    $row['orig_price']     = (float)$row['orig_price'];
    $row['rating']         = (float)$row['rating'];
    $row['rating_count']   = (int)$row['rating_count'];
    $row['affiliate_link'] = $row['affiliate_link'] ?? ''; // '' means no Amazon link set yet
    $row['discount_pct'] = $row['orig_price'] > $row['price']
        ? round((1 - $row['price'] / $row['orig_price']) * 100)
        : 0;
    $products[] = $row;
}

jsonResponse(['result' => 'success', 'products' => $products]);

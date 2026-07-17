<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();

$productCount = $db->query("SELECT COUNT(*) c FROM products WHERE is_active=1")->fetch_assoc()['c'];
$orderCount   = $db->query("SELECT COUNT(*) c FROM orders")->fetch_assoc()['c'];
$couponCount  = $db->query("SELECT COUNT(*) c FROM coupons WHERE is_active=1")->fetch_assoc()['c'];
$revenue      = $db->query("SELECT COALESCE(SUM(total_amount),0) r FROM orders WHERE status != 'cancelled'")->fetch_assoc()['r'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dashboard | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-grid-stats">
        <div class="stat-box"><div class="num"><?= (int)$productCount ?></div><div class="lbl">Active Products</div></div>
        <div class="stat-box"><div class="num"><?= (int)$orderCount ?></div><div class="lbl">Total Orders</div></div>
        <div class="stat-box"><div class="num"><?= (int)$couponCount ?></div><div class="lbl">Active Coupons</div></div>
        <div class="stat-box"><div class="num">₹<?= number_format($revenue) ?></div><div class="lbl">Total Revenue</div></div>
    </div>
    <div class="admin-card">
        <h2>Quick Actions</h2>
        <a href="product_form.php" class="btn btn-gold">+ Add New Product</a>
        <a href="coupon_form.php" class="btn btn-dark">+ Create Coupon</a>
        <a href="orders.php" class="btn btn-outline">View Orders</a>
    </div>
</div>
</body>
</html>

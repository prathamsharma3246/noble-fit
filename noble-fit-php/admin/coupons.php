<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();
$coupons = $db->query("SELECT * FROM coupons ORDER BY id DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Coupons | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-card">
        <div class="toolbar">
            <h2 style="margin:0;">Coupons</h2>
            <a href="coupon_form.php" class="btn btn-gold">+ Create Coupon</a>
        </div>
        <table>
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
            <?php while ($c = $coupons->fetch_assoc()): ?>
            <tr>
                <td><strong><?= htmlspecialchars($c['code']) ?></strong></td>
                <td><?= $c['discount_type'] === 'percent' ? 'Percent %' : 'Flat ₹' ?></td>
                <td><?= $c['discount_type'] === 'percent' ? $c['discount_value'].'%' : '₹'.number_format($c['discount_value']) ?><?php if ($c['max_discount']): ?> (max ₹<?= number_format($c['max_discount']) ?>)<?php endif; ?></td>
                <td>₹<?= number_format($c['min_order_amount']) ?></td>
                <td><?= (int)$c['used_count'] ?><?= $c['usage_limit'] ? ' / '.$c['usage_limit'] : '' ?></td>
                <td><?= $c['expiry_date'] ? htmlspecialchars($c['expiry_date']) : 'Never' ?></td>
                <td><span class="badge <?= $c['is_active']?'badge-active':'badge-inactive' ?>"><?= $c['is_active']?'Active':'Inactive' ?></span></td>
                <td>
                    <a href="coupon_form.php?id=<?= $c['id'] ?>" class="btn btn-outline btn-sm">Edit</a>
                    <a href="delete_coupon.php?id=<?= $c['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('Delete this coupon?');">Delete</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </table>
    </div>
</div>
</body>
</html>

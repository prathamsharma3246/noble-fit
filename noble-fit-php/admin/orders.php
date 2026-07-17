<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();

// Handle status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['order_pk'], $_POST['status'])) {
    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $_POST['status'], $_POST['order_pk']);
    $stmt->execute();
}

$orders = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
$statuses = ['pending','confirmed','shipped','delivered','cancelled'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Orders | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-card">
        <h2>Orders</h2>
        <table>
            <tr><th>Order ID</th><th>Customer</th><th>Mobile</th><th>Items</th><th>Total</th><th>Coupon</th><th>Status</th><th>Date</th></tr>
            <?php while ($o = $orders->fetch_assoc()):
                $itemsRes = $db->query("SELECT product_name, size, qty, price FROM order_items WHERE order_id = " . (int)$o['id']);
                $itemsHtml = [];
                while ($it = $itemsRes->fetch_assoc()) {
                    $itemsHtml[] = htmlspecialchars($it['product_name']) . ' (Size ' . htmlspecialchars($it['size']) . ' × ' . $it['qty'] . ')';
                }
            ?>
            <tr>
                <td><strong><?= htmlspecialchars($o['order_id']) ?></strong></td>
                <td><?= htmlspecialchars($o['name']) ?><br><small style="color:#5B5648;"><?= htmlspecialchars($o['address']) ?>, <?= htmlspecialchars($o['pincode']) ?></small></td>
                <td><?= htmlspecialchars($o['mobile']) ?></td>
                <td style="max-width:220px; font-size:12.5px;"><?= implode('<br>', $itemsHtml) ?></td>
                <td>₹<?= number_format($o['total_amount']) ?><?php if ($o['discount_amount'] > 0): ?><br><small style="color:#2E7D32;">−₹<?= number_format($o['discount_amount']) ?> off</small><?php endif; ?></td>
                <td><?= $o['coupon_code'] ? htmlspecialchars($o['coupon_code']) : '—' ?></td>
                <td>
                    <form method="POST" style="display:flex; gap:6px;">
                        <input type="hidden" name="order_pk" value="<?= $o['id'] ?>">
                        <select name="status" onchange="this.form.submit()">
                            <?php foreach ($statuses as $s): ?>
                            <option value="<?= $s ?>" <?= $o['status']===$s?'selected':'' ?>><?= ucfirst($s) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </form>
                </td>
                <td style="font-size:12.5px;"><?= htmlspecialchars(date('d M, h:i A', strtotime($o['created_at']))) ?></td>
            </tr>
            <?php endwhile; ?>
        </table>
    </div>
</div>
</body>
</html>

<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();

$id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
$coupon = ['code'=>'', 'discount_type'=>'percent', 'discount_value'=>'', 'min_order_amount'=>0, 'max_discount'=>'', 'usage_limit'=>'', 'expiry_date'=>'', 'is_active'=>1];
if ($id) {
    $stmt = $db->prepare("SELECT * FROM coupons WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $found = $stmt->get_result()->fetch_assoc();
    if ($found) $coupon = $found;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code       = strtoupper(trim($_POST['code'] ?? ''));
    $type       = $_POST['discount_type'] ?? 'percent';
    $value      = (float)($_POST['discount_value'] ?? 0);
    $minOrder   = (float)($_POST['min_order_amount'] ?? 0);
    $maxDisc    = $_POST['max_discount'] !== '' ? (float)$_POST['max_discount'] : null;
    $usageLimit = $_POST['usage_limit'] !== '' ? (int)$_POST['usage_limit'] : null;
    $expiry     = $_POST['expiry_date'] !== '' ? $_POST['expiry_date'] : null;
    $isActive   = isset($_POST['is_active']) ? 1 : 0;

    if ($code === '') $error = 'Coupon code zaroori hai.';
    if ($value <= 0)  $error = $error ?: 'Valid discount value daaliye.';

    if (!$error) {
        if ($id) {
            $stmt = $db->prepare("UPDATE coupons SET code=?, discount_type=?, discount_value=?, min_order_amount=?, max_discount=?, usage_limit=?, expiry_date=?, is_active=? WHERE id=?");
            $stmt->bind_param('ssdddisii', $code, $type, $value, $minOrder, $maxDisc, $usageLimit, $expiry, $isActive, $id);
        } else {
            $stmt = $db->prepare("INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expiry_date, is_active) VALUES (?,?,?,?,?,?,?,?)");
            $stmt->bind_param('ssdddisi', $code, $type, $value, $minOrder, $maxDisc, $usageLimit, $expiry, $isActive);
        }
        if (@$stmt->execute()) {
            header('Location: coupons.php');
            exit;
        } else {
            $error = 'Yeh coupon code already exist karta hai.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title><?= $id ? 'Edit' : 'Create' ?> Coupon | Noble Fit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php include __DIR__ . '/includes/topbar.php'; ?>
<div class="admin-wrap">
    <div class="admin-card">
        <h2><?= $id ? 'Edit Coupon' : 'Create New Coupon' ?></h2>
        <?php if ($error): ?><div class="alert-error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
        <form method="POST">
            <input type="hidden" name="id" value="<?= $id ?>">
            <div class="form-group">
                <label>Coupon Code * (e.g. NOBLE10)</label>
                <input type="text" name="code" value="<?= htmlspecialchars($coupon['code']) ?>" required style="text-transform:uppercase;">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Discount Type *</label>
                    <select name="discount_type">
                        <option value="percent" <?= $coupon['discount_type']==='percent'?'selected':'' ?>>Percent (%)</option>
                        <option value="flat" <?= $coupon['discount_type']==='flat'?'selected':'' ?>>Flat Amount (₹)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Discount Value *</label>
                    <input type="number" step="0.01" name="discount_value" value="<?= htmlspecialchars($coupon['discount_value']) ?>" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Minimum Order Amount (₹)</label>
                    <input type="number" step="0.01" name="min_order_amount" value="<?= htmlspecialchars($coupon['min_order_amount']) ?>">
                </div>
                <div class="form-group">
                    <label>Max Discount Cap (₹) — only for Percent type, optional</label>
                    <input type="number" step="0.01" name="max_discount" value="<?= htmlspecialchars($coupon['max_discount']) ?>">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Usage Limit — total times it can be used, blank = unlimited</label>
                    <input type="number" name="usage_limit" value="<?= htmlspecialchars($coupon['usage_limit']) ?>">
                </div>
                <div class="form-group">
                    <label>Expiry Date — blank = never expires</label>
                    <input type="date" name="expiry_date" value="<?= htmlspecialchars($coupon['expiry_date']) ?>">
                </div>
            </div>
            <div class="form-group">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" name="is_active" style="width:auto;" <?= $coupon['is_active']?'checked':'' ?>> Active
                </label>
            </div>
            <button type="submit" class="btn btn-gold"><?= $id ? 'Save Changes' : 'Create Coupon' ?></button>
            <a href="coupons.php" class="btn btn-outline">Cancel</a>
        </form>
    </div>
</div>
</body>
</html>

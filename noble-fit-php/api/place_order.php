<?php
require_once __DIR__ . '/config.php';
$db = getDb();

$input = json_decode(file_get_contents('php://input'), true);

$name    = trim($input['name'] ?? '');
$mobile  = trim($input['mobile'] ?? '');
$address = trim($input['address'] ?? '');
$pincode = trim($input['pincode'] ?? '');
$items   = $input['items'] ?? [];
$couponCode = isset($input['coupon_code']) ? trim(strtoupper($input['coupon_code'])) : '';

if ($name === '')                                    jsonResponse(['result'=>'error','message'=>'Naam zaroori hai.']);
if (!preg_match('/^\d{10}$/', $mobile))               jsonResponse(['result'=>'error','message'=>'Valid 10-digit mobile number daaliye.']);
if ($address === '')                                  jsonResponse(['result'=>'error','message'=>'Address zaroori hai.']);
if (!preg_match('/^\d{6}$/', $pincode))                jsonResponse(['result'=>'error','message'=>'Valid 6-digit pincode daaliye.']);
if (!is_array($items) || count($items) === 0)          jsonResponse(['result'=>'error','message'=>'Cart khali hai.']);

// Re-price every item against the products table so a tampered client price can't be used.
// Falls back to the submitted price only if the product can't be matched by name (e.g. it
// was since deleted/renamed) so old orders never hard-fail.
$subtotal = 0;
$safeItems = [];
foreach ($items as $item) {
    $itemName = trim($item['name'] ?? '');
    $size     = trim($item['size'] ?? '');
    $qty      = max(1, (int)($item['qty'] ?? 1));

    $stmt = $db->prepare("SELECT price FROM products WHERE TRIM(name) = TRIM(?) AND is_active = 1 LIMIT 1");
    $stmt->bind_param('s', $itemName);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $price = $row ? (float)$row['price'] : (float)($item['price'] ?? 0);

    $subtotal += $price * $qty;
    $safeItems[] = ['name' => $itemName, 'size' => $size, 'qty' => $qty, 'price' => $price];
}
$subtotal = round($subtotal, 2);

// Re-validate the coupon server-side (never trust a discount amount sent from the browser)
$discount = 0;
$appliedCoupon = null;
if ($couponCode !== '') {
    $stmt = $db->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1 LIMIT 1");
    $stmt->bind_param('s', $couponCode);
    $stmt->execute();
    $coupon = $stmt->get_result()->fetch_assoc();

    if ($coupon
        && (!$coupon['expiry_date'] || strtotime($coupon['expiry_date']) >= strtotime(date('Y-m-d')))
        && ($coupon['usage_limit'] === null || $coupon['used_count'] < $coupon['usage_limit'])
        && $subtotal >= (float)$coupon['min_order_amount']) {

        if ($coupon['discount_type'] === 'percent') {
            $discount = $subtotal * ((float)$coupon['discount_value'] / 100);
            if ($coupon['max_discount'] !== null) $discount = min($discount, (float)$coupon['max_discount']);
        } else {
            $discount = (float)$coupon['discount_value'];
        }
        $discount = min(round($discount, 2), $subtotal);
        $appliedCoupon = $coupon;
    }
}

$total = round($subtotal - $discount, 2);
$orderId = 'NF' . substr((string)round(microtime(true) * 1000), -8);

$db->begin_transaction();
try {
    $stmt = $db->prepare("INSERT INTO orders (order_id, name, mobile, address, pincode, subtotal, coupon_code, discount_amount, total_amount)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $couponForDb = $appliedCoupon ? $appliedCoupon['code'] : null;
    $stmt->bind_param('sssssdsdd', $orderId, $name, $mobile, $address, $pincode, $subtotal, $couponForDb, $discount, $total);
    $stmt->execute();
    $orderPk = $db->insert_id;

    $itemStmt = $db->prepare("INSERT INTO order_items (order_id, product_name, size, qty, price) VALUES (?, ?, ?, ?, ?)");
    foreach ($safeItems as $it) {
        $itemStmt->bind_param('issid', $orderPk, $it['name'], $it['size'], $it['qty'], $it['price']);
        $itemStmt->execute();
    }

    if ($appliedCoupon) {
        $upd = $db->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?");
        $upd->bind_param('i', $appliedCoupon['id']);
        $upd->execute();
    }

    $db->commit();
} catch (Exception $e) {
    $db->rollback();
    jsonResponse(['result' => 'error', 'message' => 'Order save nahi ho paaya. Dobara try karein.']);
}

jsonResponse([
    'result'   => 'success',
    'order_id' => $orderId,
    'subtotal' => $subtotal,
    'discount' => $discount,
    'total'    => $total,
    'items'    => $safeItems
]);

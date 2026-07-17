<?php
require_once __DIR__ . '/config.php';
$db = getDb();

$input = json_decode(file_get_contents('php://input'), true);
$code  = isset($input['code']) ? trim(strtoupper($input['code'])) : '';
$subtotal = isset($input['subtotal']) ? (float)$input['subtotal'] : 0;

if ($code === '') {
    jsonResponse(['result' => 'error', 'message' => 'Coupon code daaliye.']);
}

$stmt = $db->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1 LIMIT 1");
$stmt->bind_param('s', $code);
$stmt->execute();
$coupon = $stmt->get_result()->fetch_assoc();

if (!$coupon) {
    jsonResponse(['result' => 'error', 'message' => 'Invalid ya inactive coupon code.']);
}

if ($coupon['expiry_date'] && strtotime($coupon['expiry_date']) < strtotime(date('Y-m-d'))) {
    jsonResponse(['result' => 'error', 'message' => 'Yeh coupon expire ho chuka hai.']);
}

if ($coupon['usage_limit'] !== null && $coupon['used_count'] >= $coupon['usage_limit']) {
    jsonResponse(['result' => 'error', 'message' => 'Yeh coupon apni usage limit tak pahunch chuka hai.']);
}

if ($subtotal < (float)$coupon['min_order_amount']) {
    jsonResponse(['result' => 'error', 'message' => 'Minimum order ₹' . number_format($coupon['min_order_amount']) . ' hona chahiye is coupon ke liye.']);
}

// Calculate discount
if ($coupon['discount_type'] === 'percent') {
    $discount = $subtotal * ((float)$coupon['discount_value'] / 100);
    if ($coupon['max_discount'] !== null) {
        $discount = min($discount, (float)$coupon['max_discount']);
    }
} else {
    $discount = (float)$coupon['discount_value'];
}
$discount = min($discount, $subtotal); // never discount more than the order itself
$discount = round($discount, 2);

jsonResponse([
    'result'       => 'success',
    'code'         => $coupon['code'],
    'discount'     => $discount,
    'new_total'    => round($subtotal - $discount, 2),
    'message'      => 'Coupon applied! ₹' . number_format($discount) . ' off.'
]);

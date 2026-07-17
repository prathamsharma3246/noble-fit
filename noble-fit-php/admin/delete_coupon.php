<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();
$id = (int)($_GET['id'] ?? 0);
if ($id) {
    $stmt = $db->prepare("DELETE FROM coupons WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
}
header('Location: coupons.php');
exit;

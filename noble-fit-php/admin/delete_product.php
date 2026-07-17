<?php
require_once __DIR__ . '/includes/auth.php';
$db = getDb();
$id = (int)($_GET['id'] ?? 0);
if ($id) {
    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
}
header('Location: products.php');
exit;

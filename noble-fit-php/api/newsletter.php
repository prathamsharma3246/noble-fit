<?php
require_once __DIR__ . '/config.php';
$db = getDb();

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['result' => 'error', 'message' => 'Valid email daaliye.']);
}

$stmt = $db->prepare("INSERT IGNORE INTO newsletter (email) VALUES (?)");
$stmt->bind_param('s', $email);
$stmt->execute();

jsonResponse(['result' => 'success', 'message' => 'Subscribed!']);

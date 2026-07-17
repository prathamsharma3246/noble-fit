<?php
require_once __DIR__ . '/config.php';
$db = getDb();

$input   = json_decode(file_get_contents('php://input'), true);
$name    = trim($input['name'] ?? '');
$email   = trim($input['email'] ?? '');
$phone   = trim($input['phone'] ?? '');
$message = trim($input['message'] ?? '');

if ($name === '')    jsonResponse(['result'=>'error','message'=>'Naam zaroori hai.']);
if ($email === '')   jsonResponse(['result'=>'error','message'=>'Email zaroori hai.']);
if ($message === '') jsonResponse(['result'=>'error','message'=>'Message zaroori hai.']);

$stmt = $db->prepare("INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)");
$stmt->bind_param('ssss', $name, $email, $phone, $message);
$stmt->execute();

jsonResponse(['result' => 'success', 'message' => 'Message sent!']);

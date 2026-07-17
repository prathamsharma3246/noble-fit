<?php
/* ============================================================
   NOBLE FIT — DATABASE CONFIG
   XAMPP defaults: host=localhost, user=root, password='' (blank)
   Only change DB_PASS if you set a MySQL root password yourself.
   ============================================================ */

define('DB_HOST', 'localhost');
define('DB_NAME', 'noble_fit');
define('DB_USER', 'root');
define('DB_PASS', '');

// Allow the frontend (index.html) to call these APIs even if opened
// from a slightly different local origin/port.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

function getDb() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(['result' => 'error', 'message' => 'Database connection failed. Check api/config.php credentials.']);
            exit;
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

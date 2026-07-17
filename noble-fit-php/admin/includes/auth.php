<?php
session_start();
require_once __DIR__ . '/../../api/config.php';

if (empty($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

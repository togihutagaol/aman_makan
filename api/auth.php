<?php
// Fungsi bersama untuk login/sesi. Di-include oleh register, login, logout, me.
require __DIR__ . '/db.php';

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();

// Baca data JSON yang dikirim dari browser
function input(): array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : [];
}

function must_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_out(['ok' => false, 'pesan' => 'Gunakan metode POST'], 405);
    }
}

function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $s = db()->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
    $s->execute([$_SESSION['uid']]);
    return $s->fetch() ?: null;
}

// Dipakai nanti di API yang wajib login (lapor, pengingat, dll)
function require_login(): array {
    $u = current_user();
    if (!$u) json_out(['ok' => false, 'pesan' => 'Silakan masuk terlebih dahulu'], 401);
    return $u;
}
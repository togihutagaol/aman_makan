<?php
// Fungsi bersama untuk login/sesi. Di-include oleh semua API.
require __DIR__ . '/db.php';

$sevenDays = 60 * 60 * 24 * 7;
ini_set('session.gc_maxlifetime', (string) $sevenDays);
session_set_cookie_params([
    'lifetime' => $sevenDays,
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', // otomatis aktif di HTTPS
]);
session_start();

// Token anti-CSRF: dibuat sekali per sesi, dikirim ke browser lewat me.php
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

// Baca data JSON yang dikirim dari browser
function input(): array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : [];
}

// Semua permintaan yang mengubah data: wajib POST + token CSRF yang benar
function must_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_out(['ok' => false, 'pesan' => 'Gunakan metode POST'], 405);
    }
    $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf'], $t)) {
        json_out(['ok' => false, 'pesan' => 'Sesi tidak valid. Muat ulang halaman lalu coba lagi.'], 419);
    }
}

function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $s = db()->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
    $s->execute([$_SESSION['uid']]);
    return $s->fetch() ?: null;
}

function require_login(): array {
    $u = current_user();
    if (!$u) json_out(['ok' => false, 'pesan' => 'Silakan masuk terlebih dahulu'], 401);
    return $u;
}

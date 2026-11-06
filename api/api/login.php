<?php
require __DIR__ . '/auth.php';
must_post();

$in    = input();
$email = strtolower(trim($in['email'] ?? ''));
$pass  = $in['password'] ?? '';
$ip    = $_SERVER['REMOTE_ADDR'] ?? '';

// Batasi percobaan: maksimal 5 gagal per email dan 20 gagal per IP dalam 15 menit
$c1 = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)');
$c1->execute([$email]);
$c2 = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)');
$c2->execute([$ip]);
if ((int) $c1->fetchColumn() >= 5 || (int) $c2->fetchColumn() >= 20) {
    json_out(['ok' => false, 'pesan' => 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.'], 429);
}

$s = db()->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$s->execute([$email]);
$row = $s->fetch();

if (!$row || !password_verify($pass, $row['password_hash'])) {
    db()->prepare('INSERT INTO login_attempts (email, ip) VALUES (?, ?)')
        ->execute([mb_substr($email, 0, 150), $ip]);
    db()->exec('DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL 1 DAY)');
    json_out(['ok' => false, 'pesan' => 'Email atau password salah'], 401);
}

db()->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$email]);
session_regenerate_id(true);
$_SESSION['uid'] = (int) $row['id'];

json_out(['ok' => true, 'pesan' => 'Berhasil masuk', 'user' => current_user()]);

<?php
// Admin membuat password sementara untuk pengguna yang lupa password (tanpa email).
require __DIR__ . '/admin.php';
must_post();
$admin = require_admin();

$id = (int) (input()['id'] ?? 0);
if ($id === (int) $admin['id']) {
    json_out(['ok' => false, 'pesan' => 'Gunakan menu Akun saya untuk mengganti password sendiri'], 422);
}
$s = db()->prepare('SELECT email FROM users WHERE id = ?');
$s->execute([$id]);
$email = $s->fetchColumn();
if ($email === false) {
    json_out(['ok' => false, 'pesan' => 'Pengguna tidak ditemukan'], 404);
}

$chars = 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789';
$temp  = '';
for ($i = 0; $i < 10; $i++) {
    $temp .= $chars[random_int(0, strlen($chars) - 1)];
}

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($temp, PASSWORD_DEFAULT), $id]);
db()->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$email]);

json_out(['ok' => true, 'pesan' => 'Password sementara dibuat', 'temp' => $temp]);

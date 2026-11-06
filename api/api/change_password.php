<?php
require __DIR__ . '/auth.php';
must_post();
$user = require_login();

$in  = input();
$old = $in['old'] ?? '';
$new = $in['password'] ?? '';

if (strlen($new) < 6) {
    json_out(['ok' => false, 'pesan' => 'Password baru minimal 6 karakter'], 422);
}
$s = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
$s->execute([$user['id']]);
$hash = $s->fetchColumn();
if (!$hash || !password_verify($old, $hash)) {
    json_out(['ok' => false, 'pesan' => 'Password lama salah'], 403);
}

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);

json_out(['ok' => true, 'pesan' => 'Password berhasil diganti']);

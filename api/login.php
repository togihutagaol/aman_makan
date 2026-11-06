<?php
require __DIR__ . '/auth.php';
must_post();

$in    = input();
$email = strtolower(trim($in['email'] ?? ''));
$pass  = $in['password'] ?? '';

$s = db()->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$s->execute([$email]);
$row = $s->fetch();

if (!$row || !password_verify($pass, $row['password_hash'])) {
    json_out(['ok' => false, 'pesan' => 'Email atau password salah'], 401);
}

session_regenerate_id(true);
$_SESSION['uid'] = (int) $row['id'];

json_out(['ok' => true, 'pesan' => 'Berhasil masuk', 'user' => current_user()]);
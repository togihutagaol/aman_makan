<?php
require __DIR__ . '/auth.php';
must_post();

$in    = input();
$name  = trim($in['name'] ?? '');
$email = strtolower(trim($in['email'] ?? ''));
$pass  = $in['password'] ?? '';

if ($name === '' || mb_strlen($name) > 100) {
    json_out(['ok' => false, 'pesan' => 'Nama wajib diisi (maksimal 100 karakter)'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'pesan' => 'Format email tidak valid'], 422);
}
if (strlen($pass) < 6) {
    json_out(['ok' => false, 'pesan' => 'Password minimal 6 karakter'], 422);
}

$cek = db()->prepare('SELECT id FROM users WHERE email = ?');
$cek->execute([$email]);
if ($cek->fetch()) {
    json_out(['ok' => false, 'pesan' => 'Email sudah terdaftar'], 409);
}

$ins = db()->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$ins->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);

session_regenerate_id(true);
$_SESSION['uid'] = (int) db()->lastInsertId();

json_out(['ok' => true, 'pesan' => 'Pendaftaran berhasil', 'user' => current_user()], 201);

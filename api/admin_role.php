<?php
require __DIR__ . '/admin.php';
must_post();
$admin = require_admin();

$in   = input();
$id   = (int) ($in['id'] ?? 0);
$role = $in['role'] ?? '';

if (!in_array($role, ['warga', 'petugas', 'admin'], true)) {
    json_out(['ok' => false, 'pesan' => 'Peran tidak valid'], 422);
}
// Mencegah admin tidak sengaja mencabut perannya sendiri
if ($id === (int) $admin['id']) {
    json_out(['ok' => false, 'pesan' => 'Peran akun Anda sendiri tidak bisa diubah'], 422);
}
$cek = db()->prepare('SELECT id FROM users WHERE id = ?');
$cek->execute([$id]);
if (!$cek->fetch()) {
    json_out(['ok' => false, 'pesan' => 'Pengguna tidak ditemukan'], 404);
}

$s = db()->prepare('UPDATE users SET role = ? WHERE id = ?');
$s->execute([$role, $id]);

json_out(['ok' => true, 'pesan' => 'Peran diperbarui']);
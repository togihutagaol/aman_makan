<?php
require __DIR__ . '/admin.php';
require_admin();

// ?q=kata (cari berdasarkan nama atau email, boleh kosong)
$q = trim($_GET['q'] ?? '');
$sql = 'SELECT id, name, email, role, created_at FROM users';
$args = [];
if ($q !== '') {
    $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
    $sql .= ' WHERE name LIKE ? OR email LIKE ?';
    $args = [$like, $like];
}
$sql .= ' ORDER BY FIELD(role, "admin", "petugas", "warga"), name LIMIT 200';

$s = db()->prepare($sql);
$s->execute($args);
json_out(['ok' => true, 'pengguna' => $s->fetchAll()]);
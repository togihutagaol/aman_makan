<?php
require __DIR__ . '/auth.php';
must_post();
$user = require_login();

$in   = input();
$name = trim($in['name'] ?? '');
$date = $in['date'] ?? '';

if ($name === '' || mb_strlen($name) > 150) {
    json_out(['ok' => false, 'pesan' => 'Nama makanan wajib diisi (maksimal 150 karakter)'], 422);
}
$d = DateTime::createFromFormat('Y-m-d', $date);
if (!$d || $d->format('Y-m-d') !== $date) {
    json_out(['ok' => false, 'pesan' => 'Tanggal tidak valid'], 422);
}

$s = db()->prepare('INSERT INTO reminders (user_id, food_name, expiry_date) VALUES (?, ?, ?)');
$s->execute([$user['id'], $name, $date]);

json_out(['ok' => true, 'pesan' => 'Pengingat disimpan', 'id' => (int) db()->lastInsertId()], 201);
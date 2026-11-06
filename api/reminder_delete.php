<?php
require __DIR__ . '/auth.php';
must_post();
$user = require_login();

$id = (int) (input()['id'] ?? 0);

// Hanya bisa menghapus milik sendiri
$s = db()->prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?');
$s->execute([$id, $user['id']]);

json_out(['ok' => true, 'pesan' => 'Pengingat dihapus']);
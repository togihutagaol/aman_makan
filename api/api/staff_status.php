<?php
require __DIR__ . '/staff.php';
must_post();
require_staff();

$in     = input();
$id     = (int) ($in['id'] ?? 0);
$status = $in['status'] ?? '';

if (!in_array($status, ['terkirim', 'ditinjau', 'ditindaklanjuti'], true)) {
    json_out(['ok' => false, 'pesan' => 'Status tidak valid'], 422);
}

$s = db()->prepare('UPDATE reports SET status = ? WHERE id = ?');
$s->execute([$status, $id]);

json_out(['ok' => true, 'pesan' => 'Status diperbarui']);

<?php
require __DIR__ . '/staff.php';
require_staff();

// ?status=terkirim|ditinjau|ditindaklanjuti (kosong = semua)
$status = $_GET['status'] ?? '';
$sql = 'SELECT r.id, r.category, r.location, r.latitude, r.longitude, r.note, r.photo,
               r.status, r.is_hidden, r.created_at, u.name AS user_name
        FROM reports r JOIN users u ON u.id = r.user_id';
$args = [];
if (in_array($status, ['terkirim', 'ditinjau', 'ditindaklanjuti'], true)) {
    $sql .= ' WHERE r.status = ?';
    $args[] = $status;
}
$sql .= ' ORDER BY r.id DESC LIMIT 200';

$s = db()->prepare($sql);
$s->execute($args);
$rows = $s->fetchAll();
foreach ($rows as &$r) {
    $r['photo_url'] = $r['photo'] ? 'uploads/' . $r['photo'] : null;
}
json_out(['ok' => true, 'laporan' => $rows]);

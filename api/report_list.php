<?php
require __DIR__ . '/auth.php';
$user = require_login();

// ?scope=mine (default) = laporan saya lengkap
// ?scope=all            = semua laporan untuk peta (tanpa data pelapor)
$scope = $_GET['scope'] ?? 'mine';

if ($scope === 'all') {
    $s = db()->query(
        'SELECT id, category, location, latitude, longitude, status, created_at
         FROM reports ORDER BY id DESC LIMIT 500'
    );
    json_out(['ok' => true, 'laporan' => $s->fetchAll()]);
}

$s = db()->prepare(
    'SELECT id, category, location, latitude, longitude, note, photo, status, created_at, updated_at
     FROM reports WHERE user_id = ? ORDER BY id DESC'
);
$s->execute([$user['id']]);
$rows = $s->fetchAll();
foreach ($rows as &$r) {
    $r['photo_url'] = $r['photo'] ? 'uploads/' . $r['photo'] : null;
}
json_out(['ok' => true, 'laporan' => $rows]);
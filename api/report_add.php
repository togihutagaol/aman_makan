<?php
require __DIR__ . '/auth.php';
must_post();
$user = require_login();

// Data dikirim sebagai FormData (karena ada foto), jadi dibaca dari $_POST
$cat  = $_POST['category'] ?? '';
$loc  = trim($_POST['location'] ?? '');
$note = trim($_POST['note'] ?? '');
$lat  = ($_POST['latitude']  ?? '') !== '' ? (float) $_POST['latitude']  : null;
$lng  = ($_POST['longitude'] ?? '') !== '' ? (float) $_POST['longitude'] : null;

if (!in_array($cat, ['kedaluwarsa', 'tercemar', 'higienis', 'simpan', 'lain'], true)) {
    json_out(['ok' => false, 'pesan' => 'Kategori tidak valid'], 422);
}
if ($loc === '' || mb_strlen($loc) > 255) {
    json_out(['ok' => false, 'pesan' => 'Lokasi wajib diisi (maksimal 255 karakter)'], 422);
}
if ($note === '' || mb_strlen($note) > 2000) {
    json_out(['ok' => false, 'pesan' => 'Keterangan wajib diisi (maksimal 2000 karakter)'], 422);
}
if ($lat !== null && ($lat < -90 || $lat > 90))    $lat = null;
if ($lng !== null && ($lng < -180 || $lng > 180))  $lng = null;

// Foto (opsional)
$photo = null;
if (!empty($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['photo'];
    if ($f['error'] !== UPLOAD_ERR_OK) {
        json_out(['ok' => false, 'pesan' => 'Foto gagal diunggah'], 422);
    }
    if ($f['size'] > 3 * 1024 * 1024) {
        json_out(['ok' => false, 'pesan' => 'Ukuran foto maksimal 3 MB'], 422);
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
    if ($ext === null || @getimagesize($f['tmp_name']) === false) {
        json_out(['ok' => false, 'pesan' => 'Foto harus berformat JPG, PNG, atau WEBP'], 422);
    }
    // Pastikan folder uploads ada (dibuat otomatis jika belum ada)
    $dir = __DIR__ . '/../uploads';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (!is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Options -Indexes\n<FilesMatch \"\\.(php|phtml|php5|phar)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    $photo = bin2hex(random_bytes(12)) . '.' . $ext;   // nama acak, aman
    if (!@move_uploaded_file($f['tmp_name'], $dir . '/' . $photo)) {
        json_out(['ok' => false, 'pesan' => 'Foto tidak bisa disimpan di server'], 500);
    }
}

$s = db()->prepare(
    'INSERT INTO reports (user_id, category, location, latitude, longitude, note, photo)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$s->execute([$user['id'], $cat, $loc, $lat, $lng, $note, $photo]);

json_out(['ok' => true, 'pesan' => 'Laporan terkirim', 'id' => (int) db()->lastInsertId()], 201);
<?php
require __DIR__ . '/db.php';

try {
    $tables = db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    json_out(['ok' => true, 'pesan' => 'Koneksi database berhasil', 'tabel' => $tables]);
} catch (Throwable $e) {
    json_out(['ok' => false, 'pesan' => 'Koneksi gagal: ' . $e->getMessage()], 500);
}
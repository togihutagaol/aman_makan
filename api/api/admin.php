<?php
// Pengaman: hanya akun berperan "admin" yang boleh lewat.
require __DIR__ . '/auth.php';

function require_admin(): array {
    $u = require_login();
    if ($u['role'] !== 'admin') {
        json_out(['ok' => false, 'pesan' => 'Akses khusus admin'], 403);
    }
    return $u;
}

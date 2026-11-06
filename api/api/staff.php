<?php
// Pengaman: hanya akun berperan "petugas" atau "admin" yang boleh lewat.
require __DIR__ . '/auth.php';

function require_staff(): array {
    $u = require_login();
    if (!in_array($u['role'], ['petugas', 'admin'], true)) {
        json_out(['ok' => false, 'pesan' => 'Akses khusus petugas'], 403);
    }
    return $u;
}

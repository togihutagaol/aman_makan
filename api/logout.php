<?php
require __DIR__ . '/auth.php';
must_post();
$_SESSION = [];
session_destroy();
json_out(['ok' => true, 'pesan' => 'Berhasil keluar']);
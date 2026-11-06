<?php
// Moderasi: petugas/admin menyembunyikan atau menampilkan kembali sebuah laporan di peta.
require __DIR__ . '/staff.php';
must_post();
require_staff();

$in     = input();
$id     = (int) ($in['id'] ?? 0);
$hidden = !empty($in['hidden']) ? 1 : 0;

$s = db()->prepare('UPDATE reports SET is_hidden = ? WHERE id = ?');
$s->execute([$hidden, $id]);

json_out(['ok' => true, 'pesan' => $hidden ? 'Laporan disembunyikan' : 'Laporan ditampilkan kembali']);

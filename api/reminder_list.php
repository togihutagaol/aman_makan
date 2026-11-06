<?php
require __DIR__ . '/auth.php';
$user = require_login();

$s = db()->prepare(
    'SELECT id, food_name, expiry_date FROM reminders
     WHERE user_id = ? ORDER BY expiry_date ASC'
);
$s->execute([$user['id']]);

json_out(['ok' => true, 'pengingat' => $s->fetchAll()]);
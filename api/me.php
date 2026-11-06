<?php
require __DIR__ . '/auth.php';
json_out(['ok' => true, 'user' => current_user()]);
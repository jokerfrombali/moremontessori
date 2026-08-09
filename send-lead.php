<?php
/**
 * Приём заявок с сайта и отправка в Telegram.
 * Токен бота НЕ хранится в этом файле и НЕ лежит в репозитории —
 * он читается из config.php, который находится на уровень выше public_html
 * и потому недоступен из браузера.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// ---- Только POST -----------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

// ---- Конфиг ----------------------------------------------------------------
$configPath = dirname(__DIR__) . '/config.php';
if (!is_readable($configPath)) {
    error_log('send-lead: config.php not found at ' . $configPath);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_missing']);
    exit;
}
$config = require $configPath;

$token  = (string)($config['telegram_token'] ?? '');
$chatId = (string)($config['telegram_chat_id'] ?? '');
$thread = $config['telegram_thread_id'] ?? null;

if ($token === '' || $chatId === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_incomplete']);
    exit;
}

// ---- Читаем тело -----------------------------------------------------------
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 8192) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad_request']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$clean = static function ($value, int $max = 200): string {
    $value = is_scalar($value) ? (string)$value : '';
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value) ?? '';
    $value = trim($value);
    return mb_substr($value, 0, $max);
};

// Ловушка для ботов: скрытое поле, которое человек не заполняет.
if ($clean($data['company'] ?? '') !== '') {
    echo json_encode(['ok' => true, 'number' => 0]); // молча притворяемся, что приняли
    exit;
}

$name   = $clean($data['name']   ?? '', 100);
$phone  = $clean($data['phone']  ?? '', 40);
$age    = $clean($data['age']    ?? '', 40);
$format = $clean($data['format'] ?? '', 100);
$note   = $clean($data['note']   ?? '', 1000);
$source = $clean($data['source'] ?? 'сайт', 60);

if ($name === '' && $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_form']);
    exit;
}

// ---- Простая защита от флуда: не чаще 1 заявки в 20 секунд с одного IP ------
$ip      = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$lockDir = dirname(__DIR__) . '/lead-locks';
if (!is_dir($lockDir)) {
    @mkdir($lockDir, 0700, true);
}
$lockFile = $lockDir . '/' . sha1($ip) . '.lock';
if (is_file($lockFile) && (time() - (int)filemtime($lockFile)) < 20) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'too_many_requests']);
    exit;
}
@touch($lockFile);

// ---- Пишем заявку в локальный журнал (резерв, если Telegram недоступен) -----
$logLine = json_encode([
    'time'   => date('c'),
    'ip'     => $ip,
    'name'   => $name,
    'phone'  => $phone,
    'age'    => $age,
    'format' => $format,
    'note'   => $note,
    'source' => $source,
], JSON_UNESCAPED_UNICODE);
@file_put_contents(dirname(__DIR__) . '/leads.log', $logLine . PHP_EOL, FILE_APPEND | LOCK_EX);

// ---- Текст сообщения -------------------------------------------------------
$buildText = static function (?int $num) use ($name, $phone, $age, $format, $note, $source): string {
    $t  = ($num ? "📋 Заявка #{$num}" : '📋 Новая заявка') . " ({$source})\n\n";
    $t .= '👤 Имя: '     . ($name  !== '' ? $name  : 'не указано') . "\n";
    $t .= '📞 Телефон: ' . ($phone !== '' ? $phone : 'не указано') . "\n";
    $t .= '👶 Возраст: ' . ($age   !== '' ? $age   : 'не указано');
    if ($format !== '') { $t .= "\n📚 Формат: " . $format; }
    if ($note   !== '') { $t .= "\n💬 Комментарий: " . $note; }
    return $t;
};

// ---- Отправка в Telegram ---------------------------------------------------
$callTelegram = static function (string $method, array $payload) use ($token) {
    $ch = curl_init("https://api.telegram.org/bot{$token}/{$method}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response === false ? null : json_decode($response, true);
};

$payload = ['chat_id' => $chatId, 'text' => $buildText(null)];
if ($thread !== null && $thread !== '') {
    $payload['message_thread_id'] = (int)$thread;
}

$sent = $callTelegram('sendMessage', $payload);

if (!is_array($sent) || empty($sent['ok'])) {
    error_log('send-lead: telegram send failed: ' . json_encode($sent, JSON_UNESCAPED_UNICODE));
    // Заявка уже записана в leads.log, поэтому для пользователя это успех.
    echo json_encode(['ok' => true, 'number' => 0, 'delivered' => false]);
    exit;
}

$messageId = (int)$sent['result']['message_id'];

// Дописываем номер заявки в отправленное сообщение
$editPayload = [
    'chat_id'    => $chatId,
    'message_id' => $messageId,
    'text'       => $buildText($messageId),
];
$callTelegram('editMessageText', $editPayload);

echo json_encode(['ok' => true, 'number' => $messageId, 'delivered' => true]);

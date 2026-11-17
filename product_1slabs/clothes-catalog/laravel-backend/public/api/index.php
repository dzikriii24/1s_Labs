<?php
/**
 * NOCTURNE // ATELIER — Production REST API Controller (/api/v1/*)
 * Handles Storefront State, Products, Size Guide Masters, Collections, CMS,
 * Cart Validation, Xendit Checkout, Signed Xendit Webhooks, Orders & Community Lookbook.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key, x-callback-token');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = realpath(__DIR__ . '/../data') ? (__DIR__ . '/../data/database.json') : (__DIR__ . '/../../data/database.json');

function readDatabase(string $path): array {
    if (!file_exists($path)) {
        http_response_code(500);
        echo json_encode(['error' => 'Database file not found']);
        exit;
    }
    $fp = fopen($path, 'r');
    if ($fp) {
        flock($fp, LOCK_SH);
        $raw = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return [];
}

function writeDatabase(string $path, array $data): void {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $fp = fopen($path, 'c+');
    if ($fp) {
        flock($fp, LOCK_EX);
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function getHeaderValue(string $name): ?string {
    $target = strtolower($name);
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === $target) {
                return $v;
            }
        }
    }
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return $_SERVER[$serverKey] ?? null;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ============================================================================
// 1. /api/v1/store (GET: Hydrate Storefront, POST: Newsletter Subscription)
// ============================================================================
if ($uri === '/api/v1/store') {
    if ($method === 'GET') {
        $db = readDatabase($dbPath);
        $enabledCodes = $db['cms']['enabledPaymentChannels'] ?? [];
        $allChannels = $db['paymentChannels'] ?? [];
        $enabledChannels = array_values(array_filter($allChannels, function ($c) use ($enabledCodes) {
            return in_array($c['code'] ?? '', $enabledCodes, true);
        }));

        echo json_encode([
            'cms' => $db['cms'] ?? [],
            'sizeGuideMasters' => $db['sizeGuideMasters'] ?? [],
            'collections' => $db['collections'] ?? [],
            'products' => $db['products'] ?? [],
            'shippingAreas' => $db['shippingAreas'] ?? [],
            'paymentChannels' => $enabledChannels,
            'allPaymentChannels' => $allChannels,
            'communityPosts' => $db['communityPosts'] ?? [],
            'orders' => $db['orders'] ?? [],
            'webhookLogs' => $db['webhookLogs'] ?? [],
            'customers' => $db['customers'] ?? [],
            'newsletterSubscribers' => $db['newsletterSubscribers'] ?? [],
        ]);
        exit;
    }

    if ($method === 'POST') {
        $body = getJsonBody();
        $email = trim((string)($body['email'] ?? ''));
        if (!$email || strpos($email, '@') === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email']);
            exit;
        }
        $db = readDatabase($dbPath);
        if (!isset($db['newsletterSubscribers']) || !is_array($db['newsletterSubscribers'])) {
            $db['newsletterSubscribers'] = [];
        }
        $exists = false;
        foreach ($db['newsletterSubscribers'] as $sub) {
            if (strtolower($sub['email'] ?? '') === strtolower($email)) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $db['newsletterSubscribers'][] = [
                'email' => $email,
                'subscribedAt' => gmdate('Y-m-d\TH:i:s\Z'),
            ];
            writeDatabase($dbPath, $db);
        }
        echo json_encode(['ok' => true]);
        exit;
    }
}

// ============================================================================
// 2. /api/v1/products (GET, POST, PUT, DELETE)
// ============================================================================
if ($uri === '/api/v1/products') {
    $db = readDatabase($dbPath);

    if ($method === 'GET') {
        echo json_encode(['products' => $db['products'] ?? []]);
        exit;
    }

    if ($method === 'POST') {
        $newProduct = getJsonBody();
        if (empty($newProduct['name']) || empty($newProduct['slug'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product name and slug are required']);
            exit;
        }
        $newProduct['id'] = $newProduct['id'] ?? ('prod-' . round(microtime(true) * 1000));
        $newProduct['createdAt'] = gmdate('Y-m-d\TH:i:s\Z');
        array_unshift($db['products'], $newProduct);
        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'products' => $db['products']]);
        exit;
    }

    if ($method === 'PUT') {
        $updatedProduct = getJsonBody();
        if (empty($updatedProduct['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            exit;
        }
        foreach ($db['products'] as $idx => $p) {
            if (($p['id'] ?? '') === $updatedProduct['id']) {
                $db['products'][$idx] = $updatedProduct;
                break;
            }
        }
        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'products' => $db['products']]);
        exit;
    }

    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing product id']);
            exit;
        }
        $db['products'] = array_values(array_filter($db['products'], function ($p) use ($id) {
            return ($p['id'] ?? '') !== $id;
        }));
        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'products' => $db['products']]);
        exit;
    }
}

// ============================================================================
// 3. /api/v1/cms (PUT: Update CMS, Size Guide Masters, Collections, Shipping)
// ============================================================================
if ($uri === '/api/v1/cms' && $method === 'PUT') {
    $body = getJsonBody();
    $db = readDatabase($dbPath);

    if (isset($body['cms']) && is_array($body['cms'])) {
        $db['cms'] = array_merge($db['cms'] ?? [], $body['cms']);
    }
    if (isset($body['sizeGuideMasters']) && is_array($body['sizeGuideMasters'])) {
        $db['sizeGuideMasters'] = $body['sizeGuideMasters'];
    }
    if (isset($body['collections']) && is_array($body['collections'])) {
        $db['collections'] = $body['collections'];
    }
    if (isset($body['shippingAreas']) && is_array($body['shippingAreas'])) {
        $db['shippingAreas'] = $body['shippingAreas'];
    }

    writeDatabase($dbPath, $db);
    echo json_encode([
        'ok' => true,
        'cms' => $db['cms'],
        'sizeGuideMasters' => $db['sizeGuideMasters'],
        'collections' => $db['collections'],
        'shippingAreas' => $db['shippingAreas'],
    ]);
    exit;
}

// ============================================================================
// 4. /api/v1/cart/validate (POST)
// ============================================================================
if ($uri === '/api/v1/cart/validate' && $method === 'POST') {
    $body = getJsonBody();
    $items = $body['items'] ?? [];
    $db = readDatabase($dbPath);
    $issues = [];

    foreach ($items as $item) {
        $foundProduct = null;
        $foundVariant = null;
        foreach ($db['products'] as $p) {
            if (($p['id'] ?? '') === ($item['productId'] ?? '')) {
                $foundProduct = $p;
                foreach ($p['variants'] ?? [] as $v) {
                    if (($v['id'] ?? '') === ($item['variantId'] ?? '')) {
                        $foundVariant = $v;
                        break;
                    }
                }
                break;
            }
        }

        $reqQty = (int)($item['quantity'] ?? 1);
        if (!$foundProduct || !$foundVariant) {
            $issues[] = [
                'variantId' => $item['variantId'] ?? '',
                'productName' => 'Unknown Product',
                'requested' => $reqQty,
                'available' => 0,
                'message' => 'Product variant is no longer available.',
            ];
            continue;
        }

        $avail = (int)($foundVariant['stock'] ?? 0);
        if ($avail < $reqQty) {
            $issues[] = [
                'variantId' => $foundVariant['id'],
                'productName' => $foundProduct['name'] . ' (' . $foundVariant['colorName'] . ' / ' . $foundVariant['size'] . ')',
                'requested' => $reqQty,
                'available' => $avail,
                'message' => $avail === 0
                    ? ($foundProduct['name'] . ' (' . $foundVariant['size'] . ') is now SOLD OUT.')
                    : ('Only ' . $avail . ' unit(s) remaining for ' . $foundProduct['name'] . ' (' . $foundVariant['size'] . ').'),
            ];
        }
    }

    echo json_encode([
        'valid' => count($issues) === 0,
        'issues' => $issues,
    ]);
    exit;
}

// ============================================================================
// 5. /api/v1/checkout (POST: Create Order & Xendit Invoice + Deduct Stock)
// ============================================================================
if ($uri === '/api/v1/checkout' && $method === 'POST') {
    $idempotencyKey = getHeaderValue('Idempotency-Key') ?: ('idem-' . round(microtime(true) * 1000) . '-' . mt_rand(100, 999));
    $body = getJsonBody();
    $db = readDatabase($dbPath);

    foreach ($db['orders'] as $ord) {
        if (($ord['idempotencyKey'] ?? '') === $idempotencyKey) {
            echo json_encode(['ok' => true, 'order' => $ord, 'duplicate' => true]);
            exit;
        }
    }

    $enabledCodes = $db['cms']['enabledPaymentChannels'] ?? [];
    $selectedChannel = null;
    foreach ($db['paymentChannels'] as $ch) {
        if (($ch['code'] ?? '') === ($body['paymentChannelCode'] ?? '') && in_array($ch['code'], $enabledCodes, true)) {
            $selectedChannel = $ch;
            break;
        }
    }

    if (!$selectedChannel) {
        http_response_code(400);
        echo json_encode(['error' => 'Selected Xendit payment method is currently unavailable.']);
        exit;
    }

    $orderItems = [];
    $subtotalIdr = 0;
    $totalWeightGrams = 0;

    foreach ($body['items'] ?? [] as $reqItem) {
        $foundProduct = null;
        $foundVariant = null;
        foreach ($db['products'] as $p) {
            if (($p['id'] ?? '') === ($reqItem['productId'] ?? '')) {
                $foundProduct = $p;
                foreach ($p['variants'] ?? [] as $v) {
                    if (($v['id'] ?? '') === ($reqItem['variantId'] ?? '')) {
                        $foundVariant = $v;
                        break;
                    }
                }
                break;
            }
        }

        if (!$foundProduct || !$foundVariant) {
            http_response_code(400);
            echo json_encode(['error' => 'One or more items in your bag are no longer available.']);
            exit;
        }

        $qty = (int)($reqItem['quantity'] ?? 1);
        $stock = (int)($foundVariant['stock'] ?? 0);
        if ($stock < $qty) {
            http_response_code(409);
            echo json_encode(['error' => 'Insufficient stock for ' . $foundProduct['name'] . ' (' . $foundVariant['size'] . '). Available: ' . $stock . '.']);
            exit;
        }

        $unitPrice = isset($foundVariant['priceOverride']) ? (int)$foundVariant['priceOverride'] : (int)$foundProduct['priceIdr'];
        $lineSubtotal = $unitPrice * $qty;
        $subtotalIdr += $lineSubtotal;
        $totalWeightGrams += ((int)$foundProduct['weightGrams']) * $qty;

        $orderItems[] = [
            'variantId' => $foundVariant['id'],
            'productId' => $foundProduct['id'],
            'slug' => $foundProduct['slug'],
            'productName' => $foundProduct['name'],
            'image' => $foundProduct['images'][0]['url'] ?? '/images/prod-hoodie-front.png',
            'colorName' => $foundVariant['colorName'],
            'size' => $foundVariant['size'],
            'unitPriceIdr' => $unitPrice,
            'quantity' => $qty,
            'weightGrams' => (int)$foundProduct['weightGrams'],
            'subtotalIdr' => $lineSubtotal,
        ];
    }

    if (count($orderItems) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot checkout with an empty bag.']);
        exit;
    }

    $area = $db['shippingAreas'][0];
    foreach ($db['shippingAreas'] as $a) {
        if (($a['id'] ?? '') === ($body['shippingAddress']['areaId'] ?? '')) {
            $area = $a;
            break;
        }
    }

    $courier = $area['couriers'][0];
    foreach ($area['couriers'] as $c) {
        if (($c['code'] ?? '') === ($body['courierCode'] ?? '')) {
            $courier = $c;
            break;
        }
    }

    $weightKg = max(1, (int)ceil($totalWeightGrams / 1000));
    $freeThreshold = (int)($db['cms']['deliveryDefaults']['freeShippingThresholdIdr'] ?? 1500000);
    $qualifiesFree = ($subtotalIdr >= $freeThreshold) && (($area['province'] ?? '') !== 'International');
    $shippingCostIdr = $qualifiesFree ? 0 : ((int)$courier['ratePerKgIdr'] * $weightKg);

    $voucherCodes = [
        'ARCHIVE10' => ['type' => 'PERCENT', 'value' => 10],
        'WELCOME15' => ['type' => 'PERCENT', 'value' => 15],
        'NOCTURNE100' => ['type' => 'FIXED', 'value' => 100000],
    ];
    $discountAmountIdr = 0;
    $rawCode = strtoupper(trim((string)($body['discountCode'] ?? '')));
    if ($rawCode && isset($voucherCodes[$rawCode])) {
        $rule = $voucherCodes[$rawCode];
        $discountAmountIdr = $rule['type'] === 'PERCENT'
            ? (int)round(($subtotalIdr * $rule['value']) / 100)
            : min($subtotalIdr, $rule['value']);
    }

    $totalPaymentIdr = max(0, $subtotalIdr + $shippingCostIdr - $discountAmountIdr);
    $datePart = gmdate('Ymd');
    $randomSuffix = (string)mt_rand(100, 999);
    $orderNumber = 'NOC-' . $datePart . '-' . $randomSuffix;
    $xenditInvoiceId = 'xnd_inv_' . base_convert((string)time(), 10, 36) . '_' . $randomSuffix;
    $expMins = (int)($selectedChannel['expirationMinutes'] ?? 30);
    $expiresAt = gmdate('Y-m-d\TH:i:s\Z', time() + ($expMins * 60));

    $bankPrefixes = [
        'BCA_VA' => '39010',
        'MANDIRI_VA' => '88908',
        'BNI_VA' => '8808',
        'BRI_VA' => '26215',
        'ALFAMART' => '8810',
    ];
    $prefix = $bankPrefixes[$selectedChannel['code']] ?? '8800';
    $cat = $selectedChannel['category'] ?? 'QRIS';

    $virtualAccountNumber = ($cat === 'VIRTUAL_ACCOUNT' || $cat === 'RETAIL_OUTLET')
        ? ($prefix . (string)mt_rand(1000000000, 9999999999))
        : null;

    $qrisPayload = ($cat === 'QRIS' || $cat === 'EWALLET')
        ? ('00020101021226660014ID.CO.XENDIT.WWW011893600899' . $randomSuffix . '520456915303360540' . $totalPaymentIdr . '5802ID5916NOCTURNE ATELIER6007JAKARTA6304' . $orderNumber)
        : null;

    $paymentBlock = [
        'provider' => 'XENDIT',
        'xenditInvoiceId' => $xenditInvoiceId,
        'xenditExternalId' => $orderNumber,
        'channelCode' => $selectedChannel['code'],
        'channelName' => $selectedChannel['name'],
        'channelCategory' => $cat,
        'status' => 'PENDING',
    ];
    if ($virtualAccountNumber) $paymentBlock['virtualAccountNumber'] = $virtualAccountNumber;
    if ($qrisPayload) $paymentBlock['qrisPayload'] = $qrisPayload;

    $newOrder = [
        'id' => 'ord-' . round(microtime(true) * 1000),
        'orderNumber' => $orderNumber,
        'idempotencyKey' => $idempotencyKey,
        'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'expiresAt' => $expiresAt,
        'customer' => [
            'userId' => $body['customer']['userId'] ?? null,
            'fullName' => $body['customer']['fullName'] ?: 'Guest Customer',
            'email' => $body['customer']['email'] ?: 'guest@example.com',
            'phone' => $body['customer']['phone'] ?: '+628120000000',
        ],
        'shippingAddress' => [
            'areaId' => $area['id'],
            'areaName' => $area['areaName'],
            'province' => $area['province'],
            'postalCode' => $body['shippingAddress']['postalCode'] ?: '12160',
            'streetAddress' => $body['shippingAddress']['streetAddress'] ?? '',
            'notes' => $body['shippingAddress']['notes'] ?? '',
        ],
        'shippingMethod' => [
            'courierCode' => $courier['code'],
            'courierName' => $courier['name'],
            'service' => $courier['service'],
            'etd' => $courier['etd'],
            'totalWeightGrams' => $totalWeightGrams,
            'costIdr' => $shippingCostIdr,
        ],
        'items' => $orderItems,
        'subtotalIdr' => $subtotalIdr,
        'discountAmountIdr' => $discountAmountIdr,
        'totalPaymentIdr' => $totalPaymentIdr,
        'payment' => $paymentBlock,
        'fulfillmentStatus' => 'UNPAID',
    ];
    if ($discountAmountIdr > 0) {
        $newOrder['discountCode'] = $rawCode;
    }

    // Deduct stock atomically
    foreach ($orderItems as $item) {
        foreach ($db['products'] as $pIdx => $p) {
            if (($p['id'] ?? '') === $item['productId']) {
                foreach ($p['variants'] as $vIdx => $v) {
                    if (($v['id'] ?? '') === $item['variantId']) {
                        $db['products'][$pIdx]['variants'][$vIdx]['stock'] = max(0, (int)$v['stock'] - (int)$item['quantity']);
                    }
                }
            }
        }
    }

    array_unshift($db['orders'], $newOrder);
    writeDatabase($dbPath, $db);

    echo json_encode(['ok' => true, 'order' => $newOrder]);
    exit;
}

// ============================================================================
// 6. /api/v1/orders (GET, PATCH)
// ============================================================================
if ($uri === '/api/v1/orders') {
    $db = readDatabase($dbPath);

    if ($method === 'GET') {
        $orderNumber = $_GET['orderNumber'] ?? '';
        $email = $_GET['email'] ?? '';

        if ($orderNumber) {
            foreach ($db['orders'] as $ord) {
                if (strtoupper($ord['orderNumber'] ?? '') === strtoupper($orderNumber)) {
                    echo json_encode(['order' => $ord]);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Order not found']);
            exit;
        }

        if ($email) {
            $filtered = array_values(array_filter($db['orders'], function ($o) use ($email) {
                return strtolower($o['customer']['email'] ?? '') === strtolower($email);
            }));
            echo json_encode(['orders' => $filtered]);
            exit;
        }

        echo json_encode(['orders' => $db['orders'], 'webhookLogs' => $db['webhookLogs'] ?? []]);
        exit;
    }

    if ($method === 'PATCH') {
        $body = getJsonBody();
        $orderNumber = $body['orderNumber'] ?? '';
        if (!$orderNumber) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing orderNumber']);
            exit;
        }

        foreach ($db['orders'] as $idx => $ord) {
            if (($ord['orderNumber'] ?? '') === $orderNumber) {
                if (!empty($body['fulfillmentStatus'])) {
                    $db['orders'][$idx]['fulfillmentStatus'] = $body['fulfillmentStatus'];
                }
                if (array_key_exists('trackingNumber', $body)) {
                    $db['orders'][$idx]['trackingNumber'] = $body['trackingNumber'];
                }
                break;
            }
        }

        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'orders' => $db['orders']]);
        exit;
    }
}

// ============================================================================
// 7. /api/v1/webhooks/xendit (POST: Signed Xendit Callback Handler)
// ============================================================================
if ($uri === '/api/v1/webhooks/xendit' && $method === 'POST') {
    $expectedToken = getenv('XENDIT_WEBHOOK_VERIFICATION_TOKEN') ?: 'xnd_webhook_secret_nocturne_2026';
    $callbackToken = getHeaderValue('x-callback-token');

    if (!$callbackToken || $callbackToken !== $expectedToken) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Invalid Xendit x-callback-token signature']);
        exit;
    }

    $payload = getJsonBody();
    $externalId = (string)($payload['external_id'] ?? '');
    $xenditInvoiceId = (string)($payload['id'] ?? ($payload['payment_id'] ?? ''));
    $incomingStatus = strtoupper((string)($payload['status'] ?? 'PAID'));
    $eventId = (string)($payload['event_id'] ?? ($xenditInvoiceId . '_' . $incomingStatus));

    if (!$externalId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing external_id']);
        exit;
    }

    $db = readDatabase($dbPath);

    foreach ($db['webhookLogs'] ?? [] as $log) {
        if (($log['eventId'] ?? '') === $eventId || (($log['externalId'] ?? '') === $externalId && ($log['status'] ?? '') === $incomingStatus)) {
            $existingOrder = null;
            foreach ($db['orders'] as $o) {
                if (($o['orderNumber'] ?? '') === $externalId) {
                    $existingOrder = $o;
                    break;
                }
            }
            echo json_encode(['ok' => true, 'idempotentSkip' => true, 'order' => $existingOrder]);
            exit;
        }
    }

    $updatedOrder = null;
    foreach ($db['orders'] as $oIdx => $order) {
        if (($order['orderNumber'] ?? '') === $externalId) {
            $prevStatus = $order['payment']['status'] ?? 'PENDING';
            $db['orders'][$oIdx]['payment']['status'] = $incomingStatus;

            if ($incomingStatus === 'PAID') {
                $db['orders'][$oIdx]['paidAt'] = gmdate('Y-m-d\TH:i:s\Z');
                $curFulfill = $order['fulfillmentStatus'] ?? 'UNPAID';
                if ($curFulfill === 'UNPAID' || $curFulfill === 'CANCELLED') {
                    $db['orders'][$oIdx]['fulfillmentStatus'] = 'PROCESSING';
                }
            } elseif (($incomingStatus === 'EXPIRED' || $incomingStatus === 'FAILED') && $prevStatus === 'PENDING') {
                $db['orders'][$oIdx]['fulfillmentStatus'] = 'CANCELLED';
                foreach ($order['items'] ?? [] as $item) {
                    foreach ($db['products'] as $pIdx => $p) {
                        if (($p['id'] ?? '') === ($item['productId'] ?? '')) {
                            foreach ($p['variants'] as $vIdx => $v) {
                                if (($v['id'] ?? '') === ($item['variantId'] ?? '')) {
                                    $db['products'][$pIdx]['variants'][$vIdx]['stock'] = (int)$v['stock'] + (int)$item['quantity'];
                                }
                            }
                        }
                    }
                }
            }

            $updatedOrder = $db['orders'][$oIdx];

            array_unshift($db['webhookLogs'], [
                'id' => 'wh-' . round(microtime(true) * 1000),
                'eventId' => $eventId,
                'xenditInvoiceId' => $order['payment']['xenditInvoiceId'] ?? $xenditInvoiceId,
                'externalId' => $externalId,
                'status' => $incomingStatus,
                'channelCode' => $order['payment']['channelCode'] ?? 'QRIS',
                'amount' => $order['totalPaymentIdr'] ?? 0,
                'receivedAt' => gmdate('Y-m-d\TH:i:s\Z'),
                'signatureVerified' => true,
            ]);
            break;
        }
    }

    if (!$updatedOrder) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }

    writeDatabase($dbPath, $db);
    echo json_encode(['ok' => true, 'verified' => true, 'order' => $updatedOrder]);
    exit;
}

// ============================================================================
// 8. /api/v1/community (GET, POST, PATCH)
// ============================================================================
if ($uri === '/api/v1/community') {
    $db = readDatabase($dbPath);

    if ($method === 'GET') {
        echo json_encode(['posts' => $db['communityPosts'] ?? []]);
        exit;
    }

    if ($method === 'POST') {
        $body = getJsonBody();
        if (empty($body['consentGranted'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Explicit user consent is required before submitting community photography.']);
            exit;
        }

        $username = (string)($body['username'] ?? '@anonymous');
        if ($username !== '' && $username[0] !== '@') {
            $username = '@' . $username;
        }

        $newPost = [
            'id' => 'com-' . round(microtime(true) * 1000),
            'username' => $username,
            'customerName' => $body['customerName'] ?: 'Community Member',
            'location' => $body['location'] ?: 'JAKARTA, ID',
            'imageUrl' => $body['imageUrl'] ?: '/images/hero-campaign.png',
            'caption' => $body['caption'] ?? '',
            'productSlug' => $body['productSlug'] ?: 'silent-riot-heavy-box-hoodie-black',
            'productName' => $body['productName'] ?: 'SILENT RIOT 375GSM BOXY HOODIE — PITCH BLACK',
            'aspectRatio' => $body['aspectRatio'] ?: '4:5',
            'gridSpan' => $body['gridSpan'] ?: 'standard',
            'consentGranted' => true,
            'status' => !empty($body['autoApprove']) ? 'APPROVED' : 'PENDING',
            'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        ];

        array_unshift($db['communityPosts'], $newPost);
        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'post' => $newPost, 'posts' => $db['communityPosts']]);
        exit;
    }

    if ($method === 'PATCH') {
        $body = getJsonBody();
        $id = $body['id'] ?? '';
        if (!empty($body['deletePost'])) {
            $db['communityPosts'] = array_values(array_filter($db['communityPosts'], function ($p) use ($id) {
                return ($p['id'] ?? '') !== $id;
            }));
        } elseif (!empty($body['updatedPost']) && is_array($body['updatedPost'])) {
            $upd = $body['updatedPost'];
            foreach ($db['communityPosts'] as $idx => $p) {
                if (($p['id'] ?? '') === ($upd['id'] ?? $id)) {
                    $db['communityPosts'][$idx] = array_merge($p, $upd);
                    break;
                }
            }
        } else {
            foreach ($db['communityPosts'] as $idx => $p) {
                if (($p['id'] ?? '') === $id && !empty($body['status'])) {
                    $db['communityPosts'][$idx]['status'] = $body['status'];
                    break;
                }
            }
        }

        writeDatabase($dbPath, $db);
        echo json_encode(['ok' => true, 'posts' => $db['communityPosts']]);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'API endpoint not found', 'uri' => $uri]);


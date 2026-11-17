<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class XenditWebhookController extends Controller
{
    /**
     * Handle incoming Xendit Invoice / Payment Request Webhooks.
     * Enforces x-callback-token verification and database-level idempotency.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $callbackToken = $request->header('x-callback-token');
        $expectedToken = config('services.xendit.webhook_verification_token');

        if (! $callbackToken || ! hash_equals((string) $expectedToken, (string) $callbackToken)) {
            Log::warning('Rejected unauthorized Xendit webhook attempt.', [
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'error' => 'Unauthorized Xendit webhook signature.',
            ], 401);
        }

        $payload = $request->all();
        $externalId = (string) ($payload['external_id'] ?? '');
        $invoiceId = (string) ($payload['id'] ?? '');
        $status = strtoupper((string) ($payload['status'] ?? ''));
        $eventId = (string) ($payload['event_id'] ?? "{$invoiceId}_{$status}");

        if ($externalId === '' || ! in_array($status, ['PAID', 'SETTLED', 'EXPIRED', 'FAILED'], true)) {
            return response()->json(['error' => 'Invalid webhook payload'], 400);
        }

        $normalizedStatus = $status === 'SETTLED' ? 'PAID' : $status;

        return DB::transaction(function () use ($eventId, $invoiceId, $externalId, $normalizedStatus, $payload) {
            // 1. Idempotency Check
            $alreadyProcessed = DB::table('xendit_webhook_logs')
                ->where('event_id', $eventId)
                ->exists();

            if ($alreadyProcessed) {
                return response()->json(['ok' => true, 'idempotent_skip' => true]);
            }

            // 2. Lock Order Row for Update
            $order = DB::table('orders')
                ->where('order_number', $externalId)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            // 3. Record Webhook Audit Log
            DB::table('xendit_webhook_logs')->insert([
                'event_id' => $eventId,
                'xendit_invoice_id' => $invoiceId,
                'external_id' => $externalId,
                'status' => $normalizedStatus,
                'channel_code' => $payload['payment_channel'] ?? $order->payment_channel_code,
                'amount' => (int) ($payload['paid_amount'] ?? $order->total_payment_idr),
                'raw_payload' => json_encode($payload),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Update Order Payment & Fulfillment Status
            if ($normalizedStatus === 'PAID' && $order->payment_status !== 'PAID') {
                DB::table('orders')
                    ->where('id', $order->id)
                    ->update([
                        'payment_status' => 'PAID',
                        'fulfillment_status' => 'PROCESSING',
                        'paid_at' => now(),
                        'updated_at' => now(),
                    ]);
            } elseif (in_array($normalizedStatus, ['EXPIRED', 'FAILED'], true) && $order->payment_status === 'PENDING') {
                DB::table('orders')
                    ->where('id', $order->id)
                    ->update([
                        'payment_status' => $normalizedStatus,
                        'fulfillment_status' => 'CANCELLED',
                        'updated_at' => now(),
                    ]);
            }

            return response()->json(['ok' => true, 'status' => $normalizedStatus]);
        });
    }
}


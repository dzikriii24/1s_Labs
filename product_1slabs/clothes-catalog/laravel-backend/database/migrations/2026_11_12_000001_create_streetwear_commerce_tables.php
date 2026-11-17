<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('index_code', 16)->default('[01]');
            $table->string('name');
            $table->string('season_tag');
            $table->text('short_description');
            $table->text('editorial_copy')->nullable();
            $table->string('hero_image');
            $table->boolean('featured')->default(false);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category', 64)->index();
            $table->string('product_type', 64)->index();
            $table->unsignedBigInteger('price_idr');
            $table->unsignedBigInteger('compare_at_price_idr')->nullable();
            $table->text('short_description');
            $table->json('description_specs');
            $table->string('fabric_spec');
            $table->string('fit_profile');
            $table->json('care_instructions');
            $table->string('made_in')->default('Made in Indonesia');
            $table->unsignedInteger('weight_grams')->default(500);
            $table->unsignedTinyInteger('max_per_order')->default(3);
            $table->boolean('featured')->default(false)->index();
            $table->timestamp('release_at')->nullable();
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->unique();
            $table->string('color_name', 64);
            $table->string('color_hex', 16);
            $table->string('size', 16);
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->unsignedBigInteger('price_override_idr')->nullable();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('idempotency_key')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->index();
            $table->string('customer_phone', 32);
            $table->json('shipping_address');
            $table->json('shipping_method');
            $table->unsignedBigInteger('subtotal_idr');
            $table->string('discount_code', 32)->nullable();
            $table->unsignedBigInteger('discount_amount_idr')->default(0);
            $table->unsignedBigInteger('total_payment_idr');
            $table->string('xendit_invoice_id')->unique();
            $table->string('payment_channel_code', 32);
            $table->enum('payment_status', ['PENDING', 'PAID', 'EXPIRED', 'FAILED'])->default('PENDING')->index();
            $table->enum('fulfillment_status', ['UNPAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'])->default('UNPAID')->index();
            $table->string('tracking_number')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('xendit_webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->unique();
            $table->string('xendit_invoice_id')->index();
            $table->string('external_id')->index();
            $table->string('status', 32);
            $table->string('channel_code', 32)->nullable();
            $table->unsignedBigInteger('amount')->default(0);
            $table->json('raw_payload');
            $table->timestamps();
        });

        Schema::create('community_posts', function (Blueprint $table) {
            $table->id();
            $table->string('username', 64);
            $table->string('customer_name');
            $table->string('image_url');
            $table->text('caption')->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('consent_granted')->default(false);
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_posts');
        Schema::dropIfExists('xendit_webhook_logs');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('collections');
    }
};


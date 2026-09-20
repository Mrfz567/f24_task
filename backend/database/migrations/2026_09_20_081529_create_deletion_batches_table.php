<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deletion_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('token')->unique();
            $table->uuid('root_entry_id')->nullable()->index();
            $table->timestampTz('expires_at');
            $table->string('status', 16)->default('pending');
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deletion_batches');
    }
};

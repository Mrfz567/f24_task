<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')
                ->on('entries')
                ->cascadeOnDelete();
            $table->foreign('deletion_batch_id')
                ->references('id')
                ->on('deletion_batches')
                ->restrictOnDelete();
        });

        Schema::table('deletion_batches', function (Blueprint $table) {
            $table->foreign('root_entry_id')
                ->references('id')
                ->on('entries')
                ->nullOnDelete();
        });

        DB::statement("ALTER TABLE entries ADD CONSTRAINT entries_type_check CHECK (type IN ('file', 'folder'))");
        DB::statement("ALTER TABLE deletion_batches ADD CONSTRAINT deletion_batches_status_check CHECK (status IN ('pending', 'restored', 'purged'))");
        DB::statement("ALTER TABLE entries ADD CONSTRAINT entries_root_type_check CHECK (parent_id IS NOT NULL OR type = 'folder')");
        DB::statement('ALTER TABLE entries ADD CONSTRAINT entries_deletion_state_check CHECK ((deleted_at IS NULL AND deletion_batch_id IS NULL) OR (deleted_at IS NOT NULL AND deletion_batch_id IS NOT NULL))');
        DB::statement('CREATE UNIQUE INDEX entries_single_root_unique ON entries ((parent_id IS NULL)) WHERE parent_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX entries_parent_lower_name_unique ON entries (parent_id, lower(name)) WHERE parent_id IS NOT NULL');
        DB::statement('CREATE INDEX entries_lower_name_pattern_idx ON entries (lower(name) text_pattern_ops)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS entries_lower_name_pattern_idx');
        DB::statement('DROP INDEX IF EXISTS entries_parent_lower_name_unique');
        DB::statement('DROP INDEX IF EXISTS entries_single_root_unique');
        DB::statement('ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_deletion_state_check');
        DB::statement('ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_root_type_check');
        DB::statement('ALTER TABLE deletion_batches DROP CONSTRAINT IF EXISTS deletion_batches_status_check');
        DB::statement('ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_type_check');

        Schema::table('deletion_batches', function (Blueprint $table) {
            $table->dropForeign(['root_entry_id']);
        });

        Schema::table('entries', function (Blueprint $table) {
            $table->dropForeign(['deletion_batch_id']);
            $table->dropForeign(['parent_id']);
        });
    }
};

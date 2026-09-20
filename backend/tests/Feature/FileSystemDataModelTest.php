<?php

namespace Tests\Feature;

use App\Enums\DeletionBatchStatus;
use App\Enums\EntryType;
use App\Models\DeletionBatch;
use App\Models\Entry;
use Database\Seeders\RootEntrySeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FileSystemDataModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_suite_uses_the_dedicated_test_database(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('test-database', config('database.connections.pgsql.host'));
        $this->assertSame('f24_filesystem_test', config('database.connections.pgsql.database'));
    }

    public function test_root_seeder_is_idempotent(): void
    {
        $this->seed(RootEntrySeeder::class);
        $this->seed(RootEntrySeeder::class);

        $root = Entry::query()->whereNull('parent_id')->sole();

        $this->assertTrue(Str::isUuid($root->id));
        $this->assertSame('Root', $root->name);
        $this->assertSame(EntryType::Folder, $root->type);
    }

    public function test_entry_relationships_form_a_tree(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();
        $folder = Entry::factory()->childOf($root)->folder()->create(['name' => 'Documents']);
        $file = Entry::factory()->childOf($folder)->file('report.docx')->create();

        $this->assertTrue($root->children->contains($folder));
        $this->assertTrue($folder->isFolder());
        $this->assertTrue($folder->children->contains($file));
        $this->assertTrue($file->parent->is($folder));
        $this->assertSame(EntryType::File, $file->type);
    }

    public function test_names_are_unique_within_a_parent_regardless_of_case(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();

        Entry::factory()->childOf($root)->file('Report.docx')->create();

        $this->expectException(QueryException::class);

        Entry::factory()->childOf($root)->file('report.DOCX')->create();
    }

    public function test_same_name_can_exist_in_different_folders(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();
        $firstFolder = Entry::factory()->childOf($root)->folder()->create(['name' => 'First']);
        $secondFolder = Entry::factory()->childOf($root)->folder()->create(['name' => 'Second']);

        Entry::factory()->childOf($firstFolder)->file('notes.txt')->create();
        Entry::factory()->childOf($secondFolder)->file('notes.txt')->create();

        $this->assertDatabaseCount('entries', 5);
    }

    public function test_only_one_root_entry_is_allowed(): void
    {
        $this->seed(RootEntrySeeder::class);

        $this->expectException(QueryException::class);

        Entry::factory()->root()->create();
    }

    public function test_deletion_state_requires_a_timestamp_and_batch_together(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();
        $file = Entry::factory()->childOf($root)->file('temporary.txt')->create();
        $batch = DeletionBatch::factory()->create([
            'root_entry_id' => $file->id,
        ]);

        $this->expectException(QueryException::class);

        $file->update(['deletion_batch_id' => $batch->id]);
    }

    public function test_deletion_batch_can_access_soft_deleted_entries(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();
        $file = Entry::factory()->childOf($root)->file('temporary.txt')->create();
        $batch = DeletionBatch::factory()->create([
            'root_entry_id' => $file->id,
        ]);

        Entry::query()->whereKey($file->id)->update([
            'deletion_batch_id' => $batch->id,
            'deleted_at' => now(),
        ]);

        $this->assertSame(DeletionBatchStatus::Pending, $batch->status);
        $this->assertTrue($batch->rootEntry->is($file));
        $this->assertTrue($batch->entries->contains($file));
        $this->assertNull(Entry::query()->find($file->id));
    }

    public function test_hard_deleting_a_folder_cascades_to_its_descendants(): void
    {
        $this->seed(RootEntrySeeder::class);
        $root = Entry::query()->whereNull('parent_id')->sole();
        $folder = Entry::factory()->childOf($root)->folder()->create(['name' => 'Archive']);
        $file = Entry::factory()->childOf($folder)->file('old.txt')->create();

        $folder->forceDelete();

        $this->assertDatabaseMissing('entries', ['id' => $folder->id]);
        $this->assertDatabaseMissing('entries', ['id' => $file->id]);
    }
}

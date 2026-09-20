<?php

namespace Tests\Feature;

use App\Models\DeletionBatch;
use App\Models\Entry;
use Database\Seeders\RootEntrySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FileSystemApiTest extends TestCase
{
    use RefreshDatabase;

    private Entry $root;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RootEntrySeeder::class);
        $this->root = Entry::query()->whereNull('parent_id')->sole();
    }

    public function test_it_creates_folders_and_files(): void
    {
        $folderResponse = $this->postJson('/api/v1/entries', [
            'parent_id' => $this->root->id,
            'type' => 'folder',
            'name' => '  Project files  ',
        ]);

        $folderResponse
            ->assertCreated()
            ->assertJsonPath('data.parent_id', $this->root->id)
            ->assertJsonPath('data.type', 'folder')
            ->assertJsonPath('data.name', 'Project files')
            ->assertJsonPath('data.has_children', false);

        $fileResponse = $this->postJson('/api/v1/entries', [
            'parent_id' => $folderResponse->json('data.id'),
            'type' => 'file',
            'name' => 'project_notes.docx',
        ]);

        $fileResponse
            ->assertCreated()
            ->assertJsonPath('data.type', 'file')
            ->assertJsonPath('data.name', 'project_notes.docx');

        $this->assertDatabaseCount('entries', 3);
    }

    public function test_duplicate_names_receive_the_first_available_number(): void
    {
        $payload = [
            'parent_id' => $this->root->id,
            'type' => 'file',
            'name' => 'Report.final.pdf',
        ];

        $this->postJson('/api/v1/entries', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Report.final.pdf');

        $this->postJson('/api/v1/entries', [...$payload, 'name' => 'report.final.pdf'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'report.final (1).pdf');

        $this->postJson('/api/v1/entries', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Report.final (2).pdf');

        $folderPayload = [...$payload, 'type' => 'folder', 'name' => 'Documents'];

        $this->postJson('/api/v1/entries', $folderPayload)->assertCreated();
        $this->postJson('/api/v1/entries', $folderPayload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Documents (1)');
    }

    public function test_invalid_names_are_rejected(): void
    {
        foreach ([' ', '.', '..', 'bad/name', 'bad\\name', "bad\nname"] as $name) {
            $this->postJson('/api/v1/entries', [
                'parent_id' => $this->root->id,
                'type' => 'file',
                'name' => $name,
            ])->assertUnprocessable()->assertJsonValidationErrors('name');
        }
    }

    public function test_a_file_cannot_be_used_as_a_parent(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('parent.txt')->create();

        $this->postJson('/api/v1/entries', [
            'parent_id' => $file->id,
            'type' => 'file',
            'name' => 'child.txt',
        ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }

    public function test_it_renames_files_and_folders(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Drafts']);
        $file = Entry::factory()->childOf($folder)->file('draft.txt')->create();

        $this->patchJson("/api/v1/entries/{$folder->id}", ['name' => '  Documents  '])
            ->assertOk()
            ->assertJsonPath('data.name', 'Documents');

        $this->patchJson("/api/v1/entries/{$file->id}", ['name' => 'notes.md'])
            ->assertOk()
            ->assertJsonPath('data.name', 'notes.md');

        $this->assertDatabaseHas('entries', ['id' => $folder->id, 'name' => 'Documents']);
        $this->assertDatabaseHas('entries', ['id' => $file->id, 'name' => 'notes.md']);
    }

    public function test_rename_resolves_duplicate_names_before_the_file_extension(): void
    {
        Entry::factory()->childOf($this->root)->file('Report.pdf')->create();
        $file = Entry::factory()->childOf($this->root)->file('Draft.pdf')->create();

        $this->patchJson("/api/v1/entries/{$file->id}", ['name' => 'report.pdf'])
            ->assertOk()
            ->assertJsonPath('data.name', 'report (1).pdf');
    }

    public function test_rename_validates_the_name_and_protects_root(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();

        $this->patchJson("/api/v1/entries/{$file->id}", ['name' => 'bad/name'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->patchJson("/api/v1/entries/{$this->root->id}", ['name' => 'Other root'])
            ->assertConflict()
            ->assertExactJson([
                'message' => 'The Root folder cannot be renamed.',
                'code' => 'root_entry_protected',
            ]);
    }

    public function test_it_lists_only_immediate_children_with_folders_first(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Zebra folder']);
        Entry::factory()->childOf($folder)->file('nested.txt')->create();
        Entry::factory()->childOf($this->root)->file('Alpha.txt')->create();
        $deletedFile = Entry::factory()->childOf($this->root)->file('Deleted.txt')->create();
        $deletionBatch = DeletionBatch::factory()->create(['root_entry_id' => $deletedFile->id]);

        Entry::query()->whereKey($deletedFile->id)->update([
            'deletion_batch_id' => $deletionBatch->id,
            'deleted_at' => now(),
        ]);

        $this->getJson("/api/v1/folders/{$this->root->id}/entries")
            ->assertOk()
            ->assertJsonPath('meta.folder.id', $this->root->id)
            ->assertJsonPath('data.0.name', 'Zebra folder')
            ->assertJsonPath('data.0.has_children', true)
            ->assertJsonPath('data.1.name', 'Alpha.txt')
            ->assertJsonCount(2, 'data');
    }

    public function test_folder_tree_contains_nested_folders_but_not_files(): void
    {
        $firstLevel = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $secondLevel = Entry::factory()->childOf($firstLevel)->folder()->create(['name' => 'F24']);
        Entry::factory()->childOf($secondLevel)->file('brief.pdf')->create();

        $this->getJson('/api/v1/folders/tree')
            ->assertOk()
            ->assertJsonPath('data.id', $this->root->id)
            ->assertJsonPath('data.children.0.id', $firstLevel->id)
            ->assertJsonPath('data.children.0.children.0.id', $secondLevel->id)
            ->assertJsonPath('data.children.0.children.0.has_children', true)
            ->assertJsonCount(0, 'data.children.0.children.0.children');
    }

    public function test_breadcrumbs_are_returned_from_root_to_selected_entry(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Documents']);
        $file = Entry::factory()->childOf($folder)->file('notes.txt')->create();

        $this->getJson("/api/v1/entries/{$file->id}/breadcrumbs")
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Root')
            ->assertJsonPath('data.1.name', 'Documents')
            ->assertJsonPath('data.2.name', 'notes.txt')
            ->assertJsonCount(3, 'data');
    }

    public function test_missing_or_non_folder_resources_return_not_found(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();

        $this->getJson("/api/v1/folders/{$file->id}/entries")->assertNotFound();
        $this->getJson('/api/v1/entries/00000000-0000-4000-8000-000000000000/breadcrumbs')->assertNotFound();
    }
}

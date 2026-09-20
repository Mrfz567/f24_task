<?php

namespace Tests\Feature;

use App\Models\DeletionBatch;
use App\Models\Entry;
use Database\Seeders\RootEntrySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FileSearchApiTest extends TestCase
{
    use RefreshDatabase;

    private Entry $root;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RootEntrySeeder::class);
        $this->root = Entry::query()->whereNull('parent_id')->sole();
    }

    public function test_exact_search_is_case_insensitive_and_recursive_within_a_folder(): void
    {
        $projects = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $f24 = Entry::factory()->childOf($projects)->folder()->create(['name' => 'F24']);
        $archive = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Archive']);
        $directFile = Entry::factory()->childOf($projects)->file('Report.pdf')->create();
        $nestedFile = Entry::factory()->childOf($f24)->file('report.PDF')->create();
        Entry::factory()->childOf($archive)->file('report.pdf')->create();

        $response = $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'REPORT.pdf',
            'folder_id' => $projects->id,
            'everywhere' => 'false',
        ]));

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.scope', 'folder')
            ->assertJsonPath('meta.folder_id', $projects->id)
            ->assertJsonPath('data.0.id', $directFile->id)
            ->assertJsonPath('data.1.id', $nestedFile->id)
            ->assertJsonPath('data.1.breadcrumbs.0.name', 'Root')
            ->assertJsonPath('data.1.breadcrumbs.1.name', 'Projects')
            ->assertJsonPath('data.1.breadcrumbs.2.name', 'F24')
            ->assertJsonPath('data.1.breadcrumbs.3.name', 'report.PDF');
    }

    public function test_everywhere_search_returns_matches_from_different_branches(): void
    {
        $projects = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $archive = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Archive']);
        Entry::factory()->childOf($projects)->file('notes.txt')->create();
        Entry::factory()->childOf($archive)->file('NOTES.TXT')->create();

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'notes.txt',
            'everywhere' => 'true',
            'folder_id' => 'this-value-is-ignored',
        ]))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.scope', 'everywhere')
            ->assertJsonPath('meta.folder_id', null);
    }

    public function test_exact_search_requires_the_complete_file_name_and_excludes_folders(): void
    {
        Entry::factory()->childOf($this->root)->file('report.pdf')->create();
        Entry::factory()->childOf($this->root)->folder()->create(['name' => 'report']);

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'report',
            'folder_id' => $this->root->id,
        ]))->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_suggestions_return_at_most_ten_stably_sorted_prefix_matches(): void
    {
        for ($number = 11; $number >= 0; $number--) {
            Entry::factory()
                ->childOf($this->root)
                ->file(sprintf('Alpha-%02d.txt', $number))
                ->create();
        }

        Entry::factory()->childOf($this->root)->file('Beta.txt')->create();
        Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Alpha folder']);

        $response = $this->getJson('/api/v1/files/suggestions?'.http_build_query([
            'query' => 'alpha-',
            'folder_id' => $this->root->id,
            'everywhere' => '0',
        ]));

        $response
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.name', 'Alpha-00.txt')
            ->assertJsonPath('data.9.name', 'Alpha-09.txt');
    }

    public function test_suggestions_treat_wildcard_characters_as_literal_text(): void
    {
        Entry::factory()->childOf($this->root)->file('100% ready.txt')->create();
        Entry::factory()->childOf($this->root)->file('1000 ready.txt')->create();

        $this->getJson('/api/v1/files/suggestions?'.http_build_query([
            'query' => '100%',
            'folder_id' => $this->root->id,
        ]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', '100% ready.txt');
    }

    public function test_soft_deleted_files_are_excluded_from_search_results(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('deleted.txt')->create();
        $deletionBatch = DeletionBatch::factory()->create(['root_entry_id' => $file->id]);

        Entry::query()->whereKey($file->id)->update([
            'deletion_batch_id' => $deletionBatch->id,
            'deleted_at' => now(),
        ]);

        $parameters = http_build_query([
            'query' => 'deleted.txt',
            'everywhere' => 'true',
        ]);

        $this->getJson("/api/v1/files/search?{$parameters}")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_parameters_are_validated(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('parent.txt')->create();

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => ' ',
            'folder_id' => $this->root->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('query');

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'notes.txt',
        ]))->assertUnprocessable()->assertJsonValidationErrors('folder_id');

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'notes.txt',
            'folder_id' => $file->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('folder_id');

        $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'notes.txt',
            'everywhere' => 'not-a-boolean',
            'folder_id' => $this->root->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('everywhere');
    }

    public function test_missing_matches_return_an_empty_successful_response(): void
    {
        $response = $this->getJson('/api/v1/files/search?'.http_build_query([
            'query' => 'missing.txt',
            'folder_id' => $this->root->id,
        ]));

        $response
            ->assertOk()
            ->assertExactJson([
                'data' => [],
                'meta' => [
                    'query' => 'missing.txt',
                    'scope' => 'folder',
                    'folder_id' => $this->root->id,
                ],
            ]);
    }
}

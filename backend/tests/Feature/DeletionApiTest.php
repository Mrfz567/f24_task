<?php

namespace Tests\Feature;

use App\Domain\Filesystem\Actions\PurgeDeletion;
use App\Enums\DeletionBatchStatus;
use App\Jobs\PurgeDeletedEntries;
use App\Models\DeletionBatch;
use App\Models\Entry;
use Carbon\CarbonImmutable;
use Database\Seeders\RootEntrySeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class DeletionApiTest extends TestCase
{
    use DatabaseMigrations;

    private Entry $root;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow('2026-09-20 10:00:00 UTC');
        Queue::fake();
        $this->seed(RootEntrySeeder::class);
        $this->root = Entry::query()->whereNull('parent_id')->sole();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_deleting_a_file_creates_a_pending_group_and_delayed_job(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();

        $response = $this->deleteJson("/api/v1/entries/{$file->id}");

        $response
            ->assertAccepted()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.already_pending', false)
            ->assertJsonPath('data.expires_at', '2026-09-20T10:00:10.000000Z')
            ->assertJsonPath('data.root_entry.id', $file->id)
            ->assertJsonPath('data.root_entry.name', 'notes.txt');

        $deletionBatch = DeletionBatch::query()->where('token', $response->json('data.token'))->sole();

        $this->assertSoftDeleted('entries', ['id' => $file->id]);
        $this->assertDatabaseHas('entries', [
            'id' => $file->id,
            'deletion_batch_id' => $deletionBatch->id,
        ]);
        Queue::assertPushed(
            PurgeDeletedEntries::class,
            fn (PurgeDeletedEntries $job): bool => $job->deletionBatchId === $deletionBatch->id,
        );
    }

    public function test_repeated_delete_returns_the_existing_timer_without_scheduling_again(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();
        $firstResponse = $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();

        $this->travel(3)->seconds();

        $this->deleteJson("/api/v1/entries/{$file->id}")
            ->assertAccepted()
            ->assertJsonPath('data.token', $firstResponse->json('data.token'))
            ->assertJsonPath('data.expires_at', $firstResponse->json('data.expires_at'))
            ->assertJsonPath('data.already_pending', true);

        $this->assertDatabaseCount('deletion_batches', 1);
        Queue::assertPushed(PurgeDeletedEntries::class, 1);
    }

    public function test_deleting_a_folder_soft_deletes_its_entire_subtree(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $subfolder = Entry::factory()->childOf($folder)->folder()->create(['name' => 'F24']);
        $file = Entry::factory()->childOf($subfolder)->file('brief.pdf')->create();

        $response = $this->deleteJson("/api/v1/entries/{$folder->id}")->assertAccepted();
        $deletionBatch = DeletionBatch::query()->where('token', $response->json('data.token'))->sole();

        foreach ([$folder, $subfolder, $file] as $entry) {
            $this->assertSoftDeleted('entries', ['id' => $entry->id]);
            $this->assertDatabaseHas('entries', [
                'id' => $entry->id,
                'deletion_batch_id' => $deletionBatch->id,
            ]);
        }
    }

    public function test_root_cannot_be_deleted(): void
    {
        $this->deleteJson("/api/v1/entries/{$this->root->id}")
            ->assertConflict()
            ->assertExactJson([
                'message' => 'The Root folder cannot be deleted.',
                'code' => 'root_entry_protected',
            ]);

        $this->assertNotSoftDeleted('entries', ['id' => $this->root->id]);
        Queue::assertNothingPushed();
    }

    public function test_multiple_independent_deletions_are_supported(): void
    {
        $firstFile = Entry::factory()->childOf($this->root)->file('first.txt')->create();
        $secondFile = Entry::factory()->childOf($this->root)->file('second.txt')->create();

        $this->deleteJson("/api/v1/entries/{$firstFile->id}")->assertAccepted();
        $this->deleteJson("/api/v1/entries/{$secondFile->id}")->assertAccepted();

        $this->assertDatabaseCount('deletion_batches', 2);
        Queue::assertPushed(PurgeDeletedEntries::class, 2);

        $this->getJson('/api/v1/deletions/pending')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.server_time', '2026-09-20T10:00:00.000000Z');
    }

    public function test_overlapping_parent_deletion_returns_conflict(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $file = Entry::factory()->childOf($folder)->file('notes.txt')->create();

        $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();

        $this->deleteJson("/api/v1/entries/{$folder->id}")
            ->assertConflict()
            ->assertExactJson([
                'message' => 'This folder contains a deletion already in progress.',
                'code' => 'overlapping_deletion',
            ]);

        $this->assertNotSoftDeleted('entries', ['id' => $folder->id]);
    }

    public function test_undo_restores_the_subtree_and_is_idempotent(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $file = Entry::factory()->childOf($folder)->file('notes.txt')->create();
        $deleteResponse = $this->deleteJson("/api/v1/entries/{$folder->id}")->assertAccepted();
        $token = $deleteResponse->json('data.token');

        $this->postJson("/api/v1/deletions/{$token}/undo")
            ->assertOk()
            ->assertJsonPath('data.status', 'restored')
            ->assertJsonPath('data.already_restored', false);
        $this->assertNotSoftDeleted('entries', ['id' => $folder->id]);
        $this->assertNotSoftDeleted('entries', ['id' => $file->id]);
        $this->assertDatabaseHas('entries', [
            'id' => $file->id,
            'deletion_batch_id' => null,
        ]);

        $this->postJson("/api/v1/deletions/{$token}/undo")
            ->assertOk()
            ->assertJsonPath('data.status', 'restored')
            ->assertJsonPath('data.already_restored', true);
    }

    public function test_undo_after_expiry_purges_the_subtree_and_returns_gone(): void
    {
        $folder = Entry::factory()->childOf($this->root)->folder()->create(['name' => 'Projects']);
        $file = Entry::factory()->childOf($folder)->file('notes.txt')->create();
        $deleteResponse = $this->deleteJson("/api/v1/entries/{$folder->id}")->assertAccepted();
        $token = $deleteResponse->json('data.token');

        $this->travel(10)->seconds();

        $this->postJson("/api/v1/deletions/{$token}/undo")
            ->assertGone()
            ->assertExactJson([
                'message' => 'The Undo period for this deletion has expired.',
                'code' => 'deletion_expired',
            ]);

        $this->assertDatabaseMissing('entries', ['id' => $folder->id]);
        $this->assertDatabaseMissing('entries', ['id' => $file->id]);
        $this->assertDatabaseHas('deletion_batches', [
            'token' => $token,
            'root_entry_id' => null,
            'status' => DeletionBatchStatus::Purged->value,
        ]);

        $this->postJson("/api/v1/deletions/{$token}/undo")
            ->assertGone()
            ->assertExactJson([
                'message' => 'The Undo period for this deletion has expired.',
                'code' => 'deletion_expired',
            ]);
    }

    public function test_purge_job_is_idempotent(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();
        $deleteResponse = $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();
        $deletionBatch = DeletionBatch::query()->where('token', $deleteResponse->json('data.token'))->sole();
        $job = new PurgeDeletedEntries($deletionBatch->id);

        $this->travel(10)->seconds();

        $job->handle($this->app->make(PurgeDeletion::class));
        $job->handle($this->app->make(PurgeDeletion::class));

        $this->assertDatabaseMissing('entries', ['id' => $file->id]);
        $this->assertDatabaseHas('deletion_batches', [
            'id' => $deletionBatch->id,
            'status' => DeletionBatchStatus::Purged->value,
        ]);
    }

    public function test_early_purge_attempt_preserves_the_original_expiry(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();
        $deleteResponse = $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();
        $deletionBatch = DeletionBatch::query()->where('token', $deleteResponse->json('data.token'))->sole();

        $retryAt = $this->app->make(PurgeDeletion::class)->handle($deletionBatch->id);

        $this->assertNotNull($retryAt);
        $this->assertTrue($retryAt->equalTo($deletionBatch->expires_at));
        $this->assertSoftDeleted('entries', ['id' => $file->id]);
        $this->assertDatabaseHas('deletion_batches', [
            'id' => $deletionBatch->id,
            'status' => DeletionBatchStatus::Pending->value,
        ]);
    }

    public function test_pending_endpoint_excludes_expired_groups(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('notes.txt')->create();
        $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();

        $this->getJson('/api/v1/deletions/pending')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->travel(10)->seconds();

        $this->getJson('/api/v1/deletions/pending')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_missing_undo_token_returns_not_found(): void
    {
        $this->postJson('/api/v1/deletions/00000000-0000-4000-8000-000000000000/undo')
            ->assertNotFound();
    }

    public function test_pending_deleted_name_remains_reserved(): void
    {
        $file = Entry::factory()->childOf($this->root)->file('Report.pdf')->create();
        $this->deleteJson("/api/v1/entries/{$file->id}")->assertAccepted();

        $this->postJson('/api/v1/entries', [
            'parent_id' => $this->root->id,
            'type' => 'file',
            'name' => 'report.pdf',
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'report (1).pdf');
    }
}

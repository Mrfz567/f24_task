<?php

namespace App\Domain\Filesystem\Actions;

use App\Domain\Filesystem\Exceptions\FilesystemOperationException;
use App\Enums\DeletionBatchStatus;
use App\Jobs\PurgeDeletedEntries;
use App\Models\DeletionBatch;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DeleteEntry
{
    public function __construct(private readonly PurgeDeletion $purgeDeletion) {}

    /**
     * @return array{deletionBatch: DeletionBatch, alreadyPending: bool}
     */
    public function handle(string $entryId): array
    {
        $result = DB::transaction(function () use ($entryId): array {
            $entry = Entry::query()
                ->withTrashed()
                ->lockForUpdate()
                ->findOrFail($entryId);

            if ($entry->trashed()) {
                $deletionBatch = DeletionBatch::query()
                    ->lockForUpdate()
                    ->find($entry->deletion_batch_id);

                if ($deletionBatch instanceof DeletionBatch
                    && $deletionBatch->status === DeletionBatchStatus::Pending
                    && now()->isBefore($deletionBatch->expires_at)) {
                    $deletionBatch->setRelation('rootEntry', $entry);

                    return [
                        'deletionBatch' => $deletionBatch,
                        'alreadyPending' => true,
                        'expiredBatchId' => null,
                    ];
                }

                return [
                    'deletionBatch' => null,
                    'alreadyPending' => false,
                    'expiredBatchId' => $deletionBatch?->id,
                ];
            }

            if ($entry->parent_id === null) {
                throw FilesystemOperationException::rootIsProtected();
            }

            $subtreeIds = $this->subtreeIds($entry->id);

            /** @var Collection<int, Entry> $subtree */
            $subtree = Entry::query()
                ->withTrashed()
                ->whereIn('id', $subtreeIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($subtree->contains(fn (Entry $subtreeEntry): bool => $subtreeEntry->trashed())) {
                throw FilesystemOperationException::overlappingDeletion();
            }

            $expiresAt = now()->addSeconds(max(1, (int) config('file_browser.undo_window_seconds')));
            $deletionBatch = DeletionBatch::query()->create([
                'root_entry_id' => $entry->id,
                'expires_at' => $expiresAt,
                'status' => DeletionBatchStatus::Pending,
            ]);
            $deletedAt = now();

            Entry::query()
                ->whereIn('id', $subtreeIds)
                ->update([
                    'deletion_batch_id' => $deletionBatch->id,
                    'deleted_at' => $deletedAt,
                    'updated_at' => $deletedAt,
                ]);

            $entry->forceFill([
                'deletion_batch_id' => $deletionBatch->id,
                'deleted_at' => $deletedAt,
                'updated_at' => $deletedAt,
            ]);
            $deletionBatch->setRelation('rootEntry', $entry);

            PurgeDeletedEntries::dispatch($deletionBatch->id)
                ->delay($expiresAt)
                ->afterCommit();

            return [
                'deletionBatch' => $deletionBatch,
                'alreadyPending' => false,
                'expiredBatchId' => null,
            ];
        }, 3);

        if (is_string($result['expiredBatchId'])) {
            $this->purgeDeletion->handle($result['expiredBatchId']);
        }

        if (! $result['deletionBatch'] instanceof DeletionBatch) {
            throw FilesystemOperationException::deletionExpired();
        }

        return [
            'deletionBatch' => $result['deletionBatch'],
            'alreadyPending' => $result['alreadyPending'],
        ];
    }

    /**
     * @return list<string>
     */
    private function subtreeIds(string $entryId): array
    {
        $rows = DB::select(
            <<<'SQL'
                WITH RECURSIVE subtree AS (
                    SELECT id
                    FROM entries
                    WHERE id = ?

                    UNION ALL

                    SELECT child.id
                    FROM entries AS child
                    INNER JOIN subtree ON child.parent_id = subtree.id
                )
                SELECT id FROM subtree
                SQL,
            [$entryId],
        );

        return array_map(
            fn (object $row): string => (string) $row->id,
            $rows,
        );
    }
}

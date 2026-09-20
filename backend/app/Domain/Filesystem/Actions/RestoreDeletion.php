<?php

namespace App\Domain\Filesystem\Actions;

use App\Domain\Filesystem\Exceptions\FilesystemOperationException;
use App\Enums\DeletionBatchStatus;
use App\Models\DeletionBatch;
use App\Models\Entry;
use Illuminate\Support\Facades\DB;

class RestoreDeletion
{
    public function __construct(private readonly PurgeDeletion $purgeDeletion) {}

    /**
     * @return array{deletionBatch: DeletionBatch, alreadyRestored: bool}
     */
    public function handle(string $token): array
    {
        $result = DB::transaction(function () use ($token): ?array {
            $deletionBatch = DeletionBatch::query()
                ->where('token', $token)
                ->lockForUpdate()
                ->firstOrFail();

            if ($deletionBatch->status === DeletionBatchStatus::Restored) {
                $deletionBatch->load('rootEntry');

                return [
                    'deletionBatch' => $deletionBatch,
                    'alreadyRestored' => true,
                ];
            }

            if ($deletionBatch->status === DeletionBatchStatus::Purged
                || now()->greaterThanOrEqualTo($deletionBatch->expires_at)) {
                if ($deletionBatch->status === DeletionBatchStatus::Pending) {
                    $this->purgeDeletion->purgeLocked($deletionBatch);
                }

                return null;
            }

            Entry::query()
                ->withTrashed()
                ->where('deletion_batch_id', $deletionBatch->id)
                ->update([
                    'deletion_batch_id' => null,
                    'deleted_at' => null,
                    'updated_at' => now(),
                ]);

            $deletionBatch->forceFill([
                'status' => DeletionBatchStatus::Restored,
            ])->save();
            $deletionBatch->load('rootEntry');

            return [
                'deletionBatch' => $deletionBatch,
                'alreadyRestored' => false,
            ];
        }, 3);

        if ($result === null) {
            throw FilesystemOperationException::deletionExpired();
        }

        return $result;
    }
}

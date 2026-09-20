<?php

namespace App\Domain\Filesystem\Actions;

use App\Enums\DeletionBatchStatus;
use App\Models\DeletionBatch;
use App\Models\Entry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class PurgeDeletion
{
    public function handle(string $deletionBatchId): ?CarbonImmutable
    {
        return DB::transaction(function () use ($deletionBatchId): ?CarbonImmutable {
            $deletionBatch = DeletionBatch::query()
                ->lockForUpdate()
                ->find($deletionBatchId);

            if (! $deletionBatch instanceof DeletionBatch) {
                return null;
            }

            if ($deletionBatch->status !== DeletionBatchStatus::Pending) {
                return null;
            }

            if (now()->isBefore($deletionBatch->expires_at)) {
                return $deletionBatch->expires_at;
            }

            $this->purgeLocked($deletionBatch);

            return null;
        }, 3);
    }

    public function purgeLocked(DeletionBatch $deletionBatch): void
    {
        if ($deletionBatch->root_entry_id !== null) {
            Entry::query()
                ->withTrashed()
                ->find($deletionBatch->root_entry_id)
                ?->forceDelete();
        }

        $deletionBatch->forceFill([
            'root_entry_id' => null,
            'status' => DeletionBatchStatus::Purged,
        ])->save();
    }
}

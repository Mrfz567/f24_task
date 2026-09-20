<?php

namespace App\Domain\Filesystem\Actions;

use App\Enums\DeletionBatchStatus;
use App\Models\DeletionBatch;
use Illuminate\Database\Eloquent\Collection;

class ListPendingDeletions
{
    /**
     * @return Collection<int, DeletionBatch>
     */
    public function handle(): Collection
    {
        return DeletionBatch::query()
            ->where('status', DeletionBatchStatus::Pending)
            ->where('expires_at', '>', now())
            ->with('rootEntry')
            ->orderBy('expires_at')
            ->get();
    }
}

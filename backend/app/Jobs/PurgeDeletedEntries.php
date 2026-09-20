<?php

namespace App\Jobs;

use App\Domain\Filesystem\Actions\PurgeDeletion;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PurgeDeletedEntries implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly string $deletionBatchId) {}

    /**
     * Execute the job.
     */
    public function handle(PurgeDeletion $purgeDeletion): void
    {
        $retryAt = $purgeDeletion->handle($this->deletionBatchId);

        if ($retryAt !== null) {
            $this->release($retryAt);
        }
    }
}

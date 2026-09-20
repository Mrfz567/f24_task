<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\DeleteEntry;
use App\Domain\Filesystem\Actions\ListPendingDeletions;
use App\Domain\Filesystem\Actions\RestoreDeletion;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DeletionBatchResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeletionController extends Controller
{
    public function destroy(string $entry, DeleteEntry $deleteEntry): JsonResponse
    {
        $result = $deleteEntry->handle($entry);
        $result['deletionBatch']->setAttribute('already_pending', $result['alreadyPending']);

        return (new DeletionBatchResource($result['deletionBatch']))
            ->response()
            ->setStatusCode(202);
    }

    public function undo(string $token, RestoreDeletion $restoreDeletion): DeletionBatchResource
    {
        $result = $restoreDeletion->handle($token);
        $result['deletionBatch']->setAttribute('already_restored', $result['alreadyRestored']);

        return new DeletionBatchResource($result['deletionBatch']);
    }

    public function pending(ListPendingDeletions $listPendingDeletions): AnonymousResourceCollection
    {
        return DeletionBatchResource::collection($listPendingDeletions->handle())->additional([
            'meta' => [
                'server_time' => now()->toISOString(),
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\CreateEntry;
use App\Enums\EntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreEntryRequest;
use App\Http\Resources\Api\V1\EntryResource;
use Illuminate\Http\JsonResponse;

class EntryController extends Controller
{
    public function store(StoreEntryRequest $request, CreateEntry $createEntry): JsonResponse
    {
        $validated = $request->validated();
        $entry = $createEntry->handle(
            $validated['parent_id'],
            EntryType::from($validated['type']),
            $validated['name'],
        );

        return (new EntryResource($entry))
            ->response()
            ->setStatusCode(201);
    }
}

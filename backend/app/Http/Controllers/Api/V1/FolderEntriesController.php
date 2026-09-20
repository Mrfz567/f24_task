<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\ListFolderEntries;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EntryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FolderEntriesController extends Controller
{
    public function __invoke(string $folder, ListFolderEntries $listFolderEntries): AnonymousResourceCollection
    {
        $result = $listFolderEntries->handle($folder);

        return EntryResource::collection($result['entries'])->additional([
            'meta' => [
                'folder' => (new EntryResource($result['folder']))->resolve(),
            ],
        ]);
    }
}

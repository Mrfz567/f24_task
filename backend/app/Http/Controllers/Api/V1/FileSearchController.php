<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\SearchFiles;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\FileSearchRequest;
use App\Http\Resources\Api\V1\FileSearchResultResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;

class FileSearchController extends Controller
{
    public function search(FileSearchRequest $request, SearchFiles $searchFiles): AnonymousResourceCollection
    {
        return $this->response(
            $request,
            $searchFiles->exact($request->searchQuery(), $request->folderId()),
        );
    }

    public function suggestions(FileSearchRequest $request, SearchFiles $searchFiles): AnonymousResourceCollection
    {
        return $this->response(
            $request,
            $searchFiles->suggestions($request->searchQuery(), $request->folderId()),
        );
    }

    private function response(FileSearchRequest $request, Collection $results): AnonymousResourceCollection
    {
        return FileSearchResultResource::collection($results)->additional([
            'meta' => [
                'query' => $request->searchQuery(),
                'scope' => $request->searchEverywhere() ? 'everywhere' : 'folder',
                'folder_id' => $request->folderId(),
            ],
        ]);
    }
}

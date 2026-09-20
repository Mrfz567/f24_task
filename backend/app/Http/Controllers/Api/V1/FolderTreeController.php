<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\BuildFolderTree;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EntryResource;

class FolderTreeController extends Controller
{
    public function __invoke(BuildFolderTree $buildFolderTree): EntryResource
    {
        return new EntryResource($buildFolderTree->handle());
    }
}

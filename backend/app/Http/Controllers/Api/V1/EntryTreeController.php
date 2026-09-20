<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\BuildEntryTree;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EntryResource;

class EntryTreeController extends Controller
{
    public function __invoke(BuildEntryTree $buildEntryTree): EntryResource
    {
        return new EntryResource($buildEntryTree->handle());
    }
}

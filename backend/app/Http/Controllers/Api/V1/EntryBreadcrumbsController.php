<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Filesystem\Actions\GetEntryBreadcrumbs;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EntryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EntryBreadcrumbsController extends Controller
{
    public function __invoke(string $entry, GetEntryBreadcrumbs $getEntryBreadcrumbs): AnonymousResourceCollection
    {
        return EntryResource::collection($getEntryBreadcrumbs->handle($entry));
    }
}

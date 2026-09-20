<?php

namespace App\Domain\Filesystem\Actions;

use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;

class GetEntryBreadcrumbs
{
    /**
     * @return Collection<int, Entry>
     */
    public function handle(string $entryId): Collection
    {
        $entry = Entry::query()->findOrFail($entryId);
        $breadcrumbs = new Collection;

        while ($entry instanceof Entry) {
            $entry->loadCount('children');
            $breadcrumbs->prepend($entry);
            $entry = $entry->parent;
        }

        return $breadcrumbs->values();
    }
}

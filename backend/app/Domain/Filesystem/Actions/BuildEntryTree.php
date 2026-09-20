<?php

namespace App\Domain\Filesystem\Actions;

use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;

class BuildEntryTree
{
    public function handle(): Entry
    {
        $entries = Entry::query()
            ->withCount('children')
            ->orderByRaw("CASE WHEN type = 'folder' THEN 0 ELSE 1 END")
            ->orderByRaw('lower(name)')
            ->get();

        $root = $entries->firstWhere('parent_id', null);

        abort_unless($root instanceof Entry, 404, 'Root folder not found.');

        /** @var Collection<string, Collection<int, Entry>> $entriesByParent */
        $entriesByParent = $entries
            ->filter(fn (Entry $entry): bool => $entry->parent_id !== null)
            ->groupBy('parent_id');

        $this->attachChildren($root, $entriesByParent);

        return $root;
    }

    /**
     * @param  Collection<string, Collection<int, Entry>>  $entriesByParent
     */
    private function attachChildren(Entry $entry, Collection $entriesByParent): void
    {
        if ($entry->type === EntryType::File) {
            $entry->setRelation('treeChildren', new Collection);

            return;
        }

        $children = $entriesByParent->get($entry->id, new Collection);

        foreach ($children as $child) {
            $this->attachChildren($child, $entriesByParent);
        }

        $entry->setRelation('treeChildren', $children);
    }
}

<?php

namespace App\Domain\Filesystem\Actions;

use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;

class BuildFolderTree
{
    public function handle(): Entry
    {
        $folders = Entry::query()
            ->where('type', EntryType::Folder)
            ->withCount('children')
            ->orderByRaw('lower(name)')
            ->get();

        $root = $folders->firstWhere('parent_id', null);

        abort_unless($root instanceof Entry, 404, 'Root folder not found.');

        /** @var Collection<string, Collection<int, Entry>> $foldersByParent */
        $foldersByParent = $folders
            ->filter(fn (Entry $folder): bool => $folder->parent_id !== null)
            ->groupBy('parent_id');

        $this->attachChildren($root, $foldersByParent);

        return $root;
    }

    /**
     * @param  Collection<string, Collection<int, Entry>>  $foldersByParent
     */
    private function attachChildren(Entry $folder, Collection $foldersByParent): void
    {
        $children = $foldersByParent->get($folder->id, new Collection);

        foreach ($children as $child) {
            $this->attachChildren($child, $foldersByParent);
        }

        $folder->setRelation('treeChildren', $children);
    }
}

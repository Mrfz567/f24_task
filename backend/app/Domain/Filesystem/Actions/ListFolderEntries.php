<?php

namespace App\Domain\Filesystem\Actions;

use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Collection;

class ListFolderEntries
{
    /**
     * @return array{folder: Entry, entries: Collection<int, Entry>}
     */
    public function handle(string $folderId): array
    {
        $folder = Entry::query()
            ->where('type', EntryType::Folder)
            ->withCount('children')
            ->findOrFail($folderId);

        $entries = Entry::query()
            ->where('parent_id', $folder->id)
            ->withCount('children')
            ->orderByRaw("CASE WHEN type = 'folder' THEN 0 ELSE 1 END")
            ->orderByRaw('lower(name)')
            ->get();

        return compact('folder', 'entries');
    }
}

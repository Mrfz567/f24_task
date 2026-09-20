<?php

namespace App\Domain\Filesystem\Actions;

use App\Domain\Filesystem\Exceptions\FilesystemOperationException;
use App\Domain\Filesystem\Services\UniqueNameGenerator;
use App\Models\Entry;
use Illuminate\Support\Facades\DB;

class RenameEntry
{
    public function __construct(private readonly UniqueNameGenerator $uniqueNameGenerator) {}

    public function handle(string $entryId, string $requestedName): Entry
    {
        return DB::transaction(function () use ($entryId, $requestedName): Entry {
            $entry = Entry::query()->lockForUpdate()->findOrFail($entryId);

            if ($entry->parent_id === null) {
                throw FilesystemOperationException::rootCannotBeRenamed();
            }

            Entry::query()->whereKey($entry->parent_id)->lockForUpdate()->firstOrFail();

            $existingNames = Entry::query()
                ->withTrashed()
                ->where('parent_id', $entry->parent_id)
                ->whereKeyNot($entry->id)
                ->pluck('name');

            $entry->name = $this->uniqueNameGenerator->generate(
                $requestedName,
                $entry->type,
                $existingNames,
            );
            $entry->save();
            $entry->setAttribute('children_count', $entry->isFolder()
                ? $entry->children()->count()
                : 0);

            return $entry;
        }, 3);
    }
}

<?php

namespace App\Domain\Filesystem\Actions;

use App\Domain\Filesystem\Services\UniqueNameGenerator;
use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateEntry
{
    public function __construct(private readonly UniqueNameGenerator $uniqueNameGenerator) {}

    public function handle(string $parentId, EntryType $type, string $requestedName): Entry
    {
        return DB::transaction(function () use ($parentId, $type, $requestedName): Entry {
            $parent = Entry::query()->lockForUpdate()->findOrFail($parentId);

            if (! $parent->isFolder()) {
                throw ValidationException::withMessages([
                    'parent_id' => ['The selected parent must be a folder.'],
                ]);
            }

            $existingNames = Entry::query()
                ->withTrashed()
                ->where('parent_id', $parent->id)
                ->pluck('name');

            $name = $this->uniqueNameGenerator->generate($requestedName, $type, $existingNames);

            $entry = Entry::query()->create([
                'parent_id' => $parent->id,
                'type' => $type,
                'name' => $name,
            ]);

            $entry->setAttribute('children_count', 0);

            return $entry;
        }, 3);
    }
}

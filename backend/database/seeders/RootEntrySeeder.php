<?php

namespace Database\Seeders;

use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Database\Seeder;

class RootEntrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Entry::query()->firstOrCreate(
            ['parent_id' => null],
            [
                'type' => EntryType::Folder,
                'name' => 'Root',
            ],
        );
    }
}

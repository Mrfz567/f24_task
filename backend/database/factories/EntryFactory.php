<?php

namespace Database\Factories;

use App\Enums\EntryType;
use App\Models\Entry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Entry>
 */
class EntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parent_id' => null,
            'type' => EntryType::Folder,
            'name' => fake()->unique()->words(2, true),
            'deletion_batch_id' => null,
            'deleted_at' => null,
        ];
    }

    public function root(): static
    {
        return $this->state(fn (): array => [
            'parent_id' => null,
            'type' => EntryType::Folder,
            'name' => 'Root',
        ]);
    }

    public function childOf(Entry $parent): static
    {
        return $this->state(fn (): array => [
            'parent_id' => $parent->id,
        ]);
    }

    public function folder(): static
    {
        return $this->state(fn (): array => [
            'type' => EntryType::Folder,
        ]);
    }

    public function file(?string $name = null): static
    {
        return $this->state(fn (): array => [
            'type' => EntryType::File,
            'name' => $name ?? fake()->unique()->word().'.txt',
        ]);
    }
}

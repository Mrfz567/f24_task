<?php

namespace Database\Factories;

use App\Enums\DeletionBatchStatus;
use App\Models\DeletionBatch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DeletionBatch>
 */
class DeletionBatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'token' => (string) Str::uuid(),
            'root_entry_id' => null,
            'expires_at' => now()->addSeconds(10),
            'status' => DeletionBatchStatus::Pending,
        ];
    }

    public function restored(): static
    {
        return $this->state(fn (): array => [
            'status' => DeletionBatchStatus::Restored,
        ]);
    }

    public function purged(): static
    {
        return $this->state(fn (): array => [
            'status' => DeletionBatchStatus::Purged,
            'root_entry_id' => null,
        ]);
    }
}

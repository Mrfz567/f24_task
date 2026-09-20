<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeletionBatchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $rootEntry = $this->resource->rootEntry;

        return [
            'token' => $this->resource->token,
            'status' => $this->resource->status->value,
            'expires_at' => $this->resource->expires_at->toISOString(),
            'already_pending' => (bool) ($this->resource->already_pending ?? false),
            'already_restored' => (bool) ($this->resource->already_restored ?? false),
            'root_entry' => $rootEntry === null ? null : [
                'id' => $rootEntry->id,
                'type' => $rootEntry->type->value,
                'name' => $rootEntry->name,
            ],
        ];
    }
}

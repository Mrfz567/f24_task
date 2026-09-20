<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FileSearchResultResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $entry = $this->resource['entry'];

        return [
            'id' => $entry->id,
            'parent_id' => $entry->parent_id,
            'type' => $entry->type->value,
            'name' => $entry->name,
            'breadcrumbs' => $this->resource['breadcrumbs'],
            'created_at' => $entry->created_at?->toISOString(),
            'updated_at' => $entry->updated_at?->toISOString(),
        ];
    }
}

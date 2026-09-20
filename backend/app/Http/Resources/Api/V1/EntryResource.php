<?php

namespace App\Http\Resources\Api\V1;

use App\Enums\EntryType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'parent_id' => $this->resource->parent_id,
            'type' => $this->resource->type->value,
            'name' => $this->resource->name,
            'has_children' => $this->resource->type === EntryType::Folder
                ? ((int) ($this->resource->children_count ?? 0)) > 0
                : false,
            'children' => self::collection($this->whenLoaded('treeChildren')),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

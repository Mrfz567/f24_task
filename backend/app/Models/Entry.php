<?php

namespace App\Models;

use App\Enums\EntryType;
use Database\Factories\EntryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Entry extends Model
{
    /** @use HasFactory<EntryFactory> */
    use HasFactory;

    use HasUuids;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'parent_id',
        'type',
        'name',
        'deletion_batch_id',
        'deleted_at',
    ];

    /**
     * @return BelongsTo<Entry, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return HasMany<Entry, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * @return BelongsTo<DeletionBatch, $this>
     */
    public function deletionBatch(): BelongsTo
    {
        return $this->belongsTo(DeletionBatch::class);
    }

    public function isFolder(): bool
    {
        return $this->type === EntryType::Folder;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => EntryType::class,
            'deleted_at' => 'immutable_datetime',
        ];
    }
}

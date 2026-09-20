<?php

namespace App\Models;

use App\Enums\DeletionBatchStatus;
use Database\Factories\DeletionBatchFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DeletionBatch extends Model
{
    /** @use HasFactory<DeletionBatchFactory> */
    use HasFactory;

    use HasUuids;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'token',
        'root_entry_id',
        'expires_at',
        'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $deletionBatch): void {
            $deletionBatch->token ??= (string) Str::uuid();
        });
    }

    /**
     * @return BelongsTo<Entry, $this>
     */
    public function rootEntry(): BelongsTo
    {
        return $this->belongsTo(Entry::class, 'root_entry_id')->withTrashed();
    }

    /**
     * @return HasMany<Entry, $this>
     */
    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class)->withTrashed();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'immutable_datetime',
            'status' => DeletionBatchStatus::class,
        ];
    }
}

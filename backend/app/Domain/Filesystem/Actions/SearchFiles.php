<?php

namespace App\Domain\Filesystem\Actions;

use App\Models\Entry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SearchFiles
{
    /**
     * @return Collection<int, array{entry: Entry, breadcrumbs: list<array{id: string, name: string, type: string}>}>
     */
    public function exact(string $query, ?string $folderId): Collection
    {
        return $this->search($query, $folderId, false);
    }

    /**
     * @return Collection<int, array{entry: Entry, breadcrumbs: list<array{id: string, name: string, type: string}>}>
     */
    public function suggestions(string $query, ?string $folderId): Collection
    {
        return $this->search($query, $folderId, true, 10);
    }

    /**
     * @return Collection<int, array{entry: Entry, breadcrumbs: list<array{id: string, name: string, type: string}>}>
     */
    private function search(string $query, ?string $folderId, bool $prefix, ?int $limit = null): Collection
    {
        $nameCondition = $prefix
            ? 'starts_with(lower(entry.name), lower(?))'
            : 'lower(entry.name) = lower(?)';
        $limitClause = $limit === null ? '' : "LIMIT {$limit}";

        $rows = DB::select(
            <<<SQL
                WITH RECURSIVE folders AS (
                    SELECT
                        root.id,
                        root.parent_id,
                        root.name,
                        ARRAY[root.id]::uuid[] AS path_ids,
                        lower(root.name)::text AS path_sort,
                        jsonb_build_array(
                            jsonb_build_object('id', root.id, 'name', root.name, 'type', root.type)
                        ) AS breadcrumbs
                    FROM entries AS root
                    WHERE root.parent_id IS NULL
                        AND root.type = 'folder'
                        AND root.deleted_at IS NULL

                    UNION ALL

                    SELECT
                        child.id,
                        child.parent_id,
                        child.name,
                        folders.path_ids || child.id,
                        folders.path_sort || '/' || lower(child.name),
                        folders.breadcrumbs || jsonb_build_array(
                            jsonb_build_object('id', child.id, 'name', child.name, 'type', child.type)
                        )
                    FROM entries AS child
                    INNER JOIN folders ON child.parent_id = folders.id
                    WHERE child.type = 'folder'
                        AND child.deleted_at IS NULL
                )
                SELECT
                    entry.id,
                    entry.parent_id,
                    entry.type,
                    entry.name,
                    entry.created_at,
                    entry.updated_at,
                    folders.breadcrumbs || jsonb_build_array(
                        jsonb_build_object('id', entry.id, 'name', entry.name, 'type', entry.type)
                    ) AS search_breadcrumbs
                FROM entries AS entry
                INNER JOIN folders ON entry.parent_id = folders.id
                WHERE entry.type = 'file'
                    AND entry.deleted_at IS NULL
                    AND {$nameCondition}
                    AND (?::uuid IS NULL OR ?::uuid = ANY(folders.path_ids))
                ORDER BY lower(entry.name), folders.path_sort, entry.id
                {$limitClause}
                SQL,
            [$query, $folderId, $folderId],
        );

        return collect($rows)->map(function (object $row): array {
            $attributes = (array) $row;
            $breadcrumbsJson = (string) $attributes['search_breadcrumbs'];
            unset($attributes['search_breadcrumbs']);

            /** @var list<array{id: string, name: string, type: string}> $breadcrumbs */
            $breadcrumbs = json_decode($breadcrumbsJson, true, flags: JSON_THROW_ON_ERROR);

            return [
                'entry' => (new Entry)->newFromBuilder($attributes),
                'breadcrumbs' => $breadcrumbs,
            ];
        });
    }
}

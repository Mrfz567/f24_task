<?php

use App\Http\Controllers\Api\V1\EntryBreadcrumbsController;
use App\Http\Controllers\Api\V1\EntryController;
use App\Http\Controllers\Api\V1\FileSearchController;
use App\Http\Controllers\Api\V1\FolderEntriesController;
use App\Http\Controllers\Api\V1\FolderTreeController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('/health', function (): JsonResponse {
        return response()->json([
            'status' => 'ok',
        ]);
    })->name('health');

    Route::get('/folders/tree', FolderTreeController::class)->name('folders.tree');
    Route::get('/folders/{folder}/entries', FolderEntriesController::class)->name('folders.entries.index');
    Route::get('/entries/{entry}/breadcrumbs', EntryBreadcrumbsController::class)->name('entries.breadcrumbs');
    Route::post('/entries', [EntryController::class, 'store'])->name('entries.store');
    Route::get('/files/search', [FileSearchController::class, 'search'])->name('files.search');
    Route::get('/files/suggestions', [FileSearchController::class, 'suggestions'])->name('files.suggestions');
});

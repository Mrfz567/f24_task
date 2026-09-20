<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\EntryType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FileSearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'max:255'],
            'everywhere' => ['required', 'boolean'],
            'folder_id' => [
                Rule::requiredIf(! $this->boolean('everywhere')),
                'nullable',
                'uuid',
                Rule::exists('entries', 'id')->where(fn ($query) => $query
                    ->where('type', EntryType::Folder->value)
                    ->whereNull('deleted_at')),
            ],
        ];
    }

    public function searchQuery(): string
    {
        return $this->validated('query');
    }

    public function searchEverywhere(): bool
    {
        return $this->boolean('everywhere');
    }

    public function folderId(): ?string
    {
        return $this->searchEverywhere() ? null : $this->validated('folder_id');
    }

    protected function prepareForValidation(): void
    {
        $everywhere = $this->input('everywhere', false);

        if (is_string($everywhere)) {
            $everywhere = match (strtolower($everywhere)) {
                'true', '1' => true,
                'false', '0' => false,
                default => $everywhere,
            };
        }

        $data = ['everywhere' => $everywhere];

        if (is_string($this->input('query'))) {
            $data['query'] = trim($this->string('query')->toString());
        }

        if ($everywhere === true) {
            $data['folder_id'] = null;
        }

        $this->merge($data);
    }
}

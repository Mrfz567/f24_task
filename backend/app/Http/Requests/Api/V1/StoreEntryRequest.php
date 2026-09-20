<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\EntryType;
use App\Rules\ValidEntryName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEntryRequest extends FormRequest
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
            'parent_id' => [
                'required',
                'uuid',
                Rule::exists('entries', 'id')->whereNull('deleted_at'),
            ],
            'type' => ['required', Rule::enum(EntryType::class)],
            'name' => [
                'required',
                'string',
                'max:255',
                new ValidEntryName,
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->string('name')->toString())]);
        }
    }
}

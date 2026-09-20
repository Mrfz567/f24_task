<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class ValidEntryName implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $name = (string) $value;

        if ($name === '.' || $name === '..') {
            $fail('The :attribute cannot be "." or "..".');
        }

        if (preg_match('/[\/\\\\\x00-\x1F\x7F]/u', $name) === 1) {
            $fail('The :attribute contains an unsupported character.');
        }
    }
}

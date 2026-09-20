<?php

namespace App\Domain\Filesystem\Services;

use App\Enums\EntryType;
use Illuminate\Validation\ValidationException;

class UniqueNameGenerator
{
    /**
     * @param  iterable<string>  $existingNames
     */
    public function generate(string $requestedName, EntryType $type, iterable $existingNames): string
    {
        $reservedNames = [];

        foreach ($existingNames as $existingName) {
            $reservedNames[mb_strtolower($existingName)] = true;
        }

        if (! isset($reservedNames[mb_strtolower($requestedName)])) {
            return $requestedName;
        }

        [$baseName, $extension] = $this->splitName($requestedName, $type);

        for ($number = 1; $number <= 10_000; $number++) {
            $suffix = " ({$number})";
            $availableBaseLength = 255 - mb_strlen($extension) - mb_strlen($suffix);

            if ($availableBaseLength < 1) {
                throw ValidationException::withMessages([
                    'name' => ['A unique name cannot be generated within the 255 character limit.'],
                ]);
            }

            $candidate = mb_substr($baseName, 0, $availableBaseLength).$suffix.$extension;

            if (! isset($reservedNames[mb_strtolower($candidate)])) {
                return $candidate;
            }
        }

        throw ValidationException::withMessages([
            'name' => ['A unique name could not be generated.'],
        ]);
    }

    /**
     * @return array{string, string}
     */
    private function splitName(string $name, EntryType $type): array
    {
        if ($type === EntryType::Folder) {
            return [$name, ''];
        }

        $lastDotPosition = mb_strrpos($name, '.');

        if ($lastDotPosition === false || $lastDotPosition === 0) {
            return [$name, ''];
        }

        return [
            mb_substr($name, 0, $lastDotPosition),
            mb_substr($name, $lastDotPosition),
        ];
    }
}

<?php

namespace App\Domain\Filesystem\Exceptions;

use RuntimeException;

class FilesystemOperationException extends RuntimeException
{
    private function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $statusCode,
    ) {
        parent::__construct($message);
    }

    public static function rootIsProtected(): self
    {
        return new self('The Root folder cannot be deleted.', 'root_entry_protected', 409);
    }

    public static function rootCannotBeRenamed(): self
    {
        return new self('The Root folder cannot be renamed.', 'root_entry_protected', 409);
    }

    public static function overlappingDeletion(): self
    {
        return new self(
            'This folder contains a deletion already in progress.',
            'overlapping_deletion',
            409,
        );
    }

    public static function deletionExpired(): self
    {
        return new self('The Undo period for this deletion has expired.', 'deletion_expired', 410);
    }
}

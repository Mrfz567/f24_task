<?php

namespace App\Enums;

enum DeletionBatchStatus: string
{
    case Pending = 'pending';
    case Restored = 'restored';
    case Purged = 'purged';
}

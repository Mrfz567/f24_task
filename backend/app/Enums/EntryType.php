<?php

namespace App\Enums;

enum EntryType: string
{
    case File = 'file';
    case Folder = 'folder';
}

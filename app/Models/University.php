<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class University extends Model
{
    protected $fillable = [
        'name',
        'country',
        'city',
        'ranking',
        'programs',
        'description',
        'website',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'programs' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scholarships()
    {
        return $this->hasMany(Scholarship::class);
    }
}

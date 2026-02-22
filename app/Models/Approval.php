<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    public const ACTION_APPROVED = 'approved';
    public const ACTION_REJECTED = 'rejected';

    public const STEP_ONE = 1;
    public const STEP_TWO = 2;

    protected $fillable = [
        'application_id',
        'actor_id',
        'step',
        'action',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'step' => 'integer',
        ];
    }

    // ── Relationships ───────────────────────────────────────────

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}

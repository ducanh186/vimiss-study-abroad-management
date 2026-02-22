<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'staff_code',
        'capacity_max',
        'specialty',
        'bio',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Count currently assigned students
     */
    public function currentStudentCount(): int
    {
        return MentorStudentAssignment::where('mentor_id', $this->user_id)
            ->whereNull('unassigned_at')
            ->count();
    }

    /**
     * Check if mentor has capacity for more students
     */
    public function hasCapacity(): bool
    {
        return $this->is_active && $this->currentStudentCount() < $this->capacity_max;
    }

    /**
     * Get available slots
     */
    public function availableSlots(): int
    {
        return max(0, $this->capacity_max - $this->currentStudentCount());
    }

    /**
     * Generate next staff code
     */
    public static function generateStaffCode(): string
    {
        $last = static::orderByDesc('staff_code')->value('staff_code');
        if ($last) {
            $num = (int) substr($last, 1) + 1;
        } else {
            $num = 1;
        }
        return 'M' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
}

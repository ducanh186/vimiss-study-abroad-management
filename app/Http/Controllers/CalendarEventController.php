<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = CalendarEvent::with('creator:id,name');

        // Filter by visibility based on role
        $query->visibleTo($user->role);

        if ($month = $request->query('month')) {
            $query->whereMonth('start_date', $month);
        }
        if ($year = $request->query('year')) {
            $query->whereYear('start_date', $year);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $events = $query->orderBy('start_date')
            ->paginate($request->query('per_page', 50));

        return response()->json($events);
    }

    public function show(CalendarEvent $calendarEvent): JsonResponse
    {
        return response()->json(['event' => $calendarEvent->load('creator:id,name')]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'type' => ['required', 'in:deadline,meeting,reminder,other'],
            'visibility' => ['sometimes', 'in:all,admin,mentor,student'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $event = CalendarEvent::create($validated);

        return response()->json([
            'message' => 'Calendar event created.',
            'event' => $event,
        ], 201);
    }

    public function update(Request $request, CalendarEvent $calendarEvent): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'type' => ['sometimes', 'in:deadline,meeting,reminder,other'],
            'visibility' => ['sometimes', 'in:all,admin,mentor,student'],
        ]);

        $calendarEvent->update($validated);

        return response()->json([
            'message' => 'Calendar event updated.',
            'event' => $calendarEvent->fresh(),
        ]);
    }

    public function destroy(CalendarEvent $calendarEvent): JsonResponse
    {
        $calendarEvent->delete();
        return response()->json(['message' => 'Calendar event deleted.']);
    }
}

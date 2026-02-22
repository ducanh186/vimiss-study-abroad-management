<?php

namespace App\Http\Controllers;

use App\Models\Scholarship;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UniversityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = University::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('country', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $universities = $query->orderBy('name')
            ->paginate($request->query('per_page', 15));

        return response()->json($universities);
    }

    public function show(University $university): JsonResponse
    {
        $university->load('scholarships');
        return response()->json(['university' => $university]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'ranking' => ['sometimes', 'nullable', 'integer'],
            'programs' => ['sometimes', 'nullable', 'array'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
        ]);

        $university = University::create($validated);

        return response()->json([
            'message' => 'University created.',
            'university' => $university,
        ], 201);
    }

    public function update(Request $request, University $university): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'country' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'ranking' => ['sometimes', 'nullable', 'integer'],
            'programs' => ['sometimes', 'nullable', 'array'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $university->update($validated);

        return response()->json([
            'message' => 'University updated.',
            'university' => $university->fresh(),
        ]);
    }

    public function destroy(University $university): JsonResponse
    {
        $university->delete();
        return response()->json(['message' => 'University deleted.']);
    }
}

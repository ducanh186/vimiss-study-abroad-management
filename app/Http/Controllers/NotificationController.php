<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List notifications for current user
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->query('per_page', 50));

        // Map to include title/body from data
        $items = collect($notifications->items())->map(fn ($n) => [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'body' => $n->body,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ]);

        return response()->json([
            'notifications' => $items,
            'total' => $notifications->total(),
        ]);
    }

    /**
     * Unread count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark notification as read
     */
    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($notificationId);

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }

    /**
     * Mark all as read
     */
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\Notification;
use App\Services\DriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * List documents for an application
     */
    public function index(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // Access check
        if ($user->isStudent() && $application->student_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $documents = $application->documents()
            ->with('uploader:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['documents' => $documents]);
    }

    /**
     * Upload document — students (own app), mentors (assigned), admin/director.
     * Files are uploaded to Google Drive via service account.
     */
    public function store(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // Policy-style anti-IDOR check
        if ($user->isStudent() && $application->student_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isStudent() || $user->isMentor() || $user->isAdmin() || $user->isDirector()) {
            // allowed
        } else {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx'],
            'type' => ['required', 'in:' . implode(',', ApplicationDocument::TYPES)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $file = $request->file('file');
        $safeName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $checksum = hash_file('sha256', $file->getRealPath());

        // Try Google Drive upload, fallback to local storage
        $storage = ApplicationDocument::STORAGE_LOCAL;
        $driveFileId = null;
        $driveFolderId = null;
        $localPath = null;

        try {
            /** @var DriveService $driveService */
            $driveService = app(DriveService::class);
            $folderId = $driveService->getOrCreateApplicationFolder($application->id);
            $result = $driveService->upload(
                $file->getRealPath(),
                $safeName,
                $file->getMimeType(),
                $folderId
            );
            $storage = ApplicationDocument::STORAGE_DRIVE;
            $driveFileId = $result['file_id'];
            $driveFolderId = $result['folder_id'];
            $localPath = "drive://{$driveFileId}";
        } catch (\Throwable $e) {
            // Fallback: store locally
            $localPath = $file->storeAs(
                "documents/application_{$application->id}",
                $safeName,
                'local'
            );
            $storage = ApplicationDocument::STORAGE_LOCAL;
        }

        $document = ApplicationDocument::create([
            'application_id' => $application->id,
            'uploaded_by' => $user->id,
            'file_path' => $localPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'type' => $request->type,
            'label_status' => ApplicationDocument::LABEL_PENDING,
            'notes' => $request->notes,
            'storage' => $storage,
            'drive_file_id' => $driveFileId,
            'drive_folder_id' => $driveFolderId,
            'checksum' => $checksum,
        ]);

        return response()->json([
            'message' => 'Document uploaded.',
            'document' => $document,
        ], 201);
    }

    /**
     * Mentor/Admin: update document label
     */
    public function updateLabel(Request $request, ApplicationDocument $document): JsonResponse
    {
        $user = $request->user();
        $app = $document->application;

        if ($user->isMentor() && $app->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isStudent()) {
            return response()->json(['message' => 'Students cannot update document labels.'], 403);
        }

        $validated = $request->validate([
            'label_status' => ['required', 'in:' . implode(',', ApplicationDocument::LABELS)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $oldLabel = $document->label_status;
        $document->update($validated);

        // If label changed to need_more, notify student
        if ($validated['label_status'] === ApplicationDocument::LABEL_NEED_MORE && $oldLabel !== ApplicationDocument::LABEL_NEED_MORE) {
            Notification::notify($app->student_id, 'Document Needs More Info', "Document '{$document->original_name}' needs additional information.", 'document_need_more');
        }

        return response()->json([
            'message' => 'Document label updated.',
            'document' => $document->fresh(),
        ]);
    }

    /**
     * Delete document
     */
    public function destroy(ApplicationDocument $document): JsonResponse
    {
        $user = request()->user();
        $app = $document->application;

        if ($user->isMentor() && $app->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isStudent()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }

    /**
     * Download document (attachment disposition)
     */
    public function download(ApplicationDocument $document): mixed
    {
        $user = request()->user();
        $app = $document->application;

        if ($user->isStudent() && $app->student_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isMentor() && $app->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $this->streamDocument($document, 'attachment');
    }

    /**
     * Preview document inline (PDF viewer / image)
     */
    public function preview(ApplicationDocument $document): mixed
    {
        $user = request()->user();
        $app = $document->application;

        if ($user->isStudent() && $app->student_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isMentor() && $app->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $this->streamDocument($document, 'inline');
    }

    /**
     * Stream document from Drive or local storage.
     */
    protected function streamDocument(ApplicationDocument $document, string $disposition): mixed
    {
        $filename = $document->original_name;

        if ($document->isOnDrive()) {
            try {
                /** @var DriveService $driveService */
                $driveService = app(DriveService::class);
                $stream = $driveService->download($document->drive_file_id);
                $content = (string) $stream;

                return response($content, 200, [
                    'Content-Type' => $document->mime_type,
                    'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
                    'Content-Length' => strlen($content),
                    'Cache-Control' => 'private, max-age=300',
                ]);
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Failed to retrieve file from Drive.'], 502);
            }
        }

        // Local fallback
        $path = Storage::disk('local')->path($document->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        if ($disposition === 'inline') {
            return response()->file($path, [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => "inline; filename=\"{$filename}\"",
            ]);
        }

        return response()->download($path, $filename);
    }
}

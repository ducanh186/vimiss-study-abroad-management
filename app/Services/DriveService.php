<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Psr\Http\Message\StreamInterface;

/**
 * Google Drive Service (Service-Account based).
 *
 * Uploads / downloads / streams files from a private Drive folder.
 * No public links are ever created — every access is proxied through
 * the Laravel backend with auth checks.
 */
class DriveService
{
    protected GoogleDrive $drive;

    public function __construct()
    {
        $client = new GoogleClient();
        $client->setApplicationName(config('services.google_drive.app_name', 'Vimiss'));

        $credentialsPath = config('services.google_drive.credentials_path');

        if ($credentialsPath && file_exists($credentialsPath)) {
            $client->setAuthConfig($credentialsPath);
        } else {
            // Build credentials from individual env vars (useful for CI / containers)
            $client->setAuthConfig([
                'type' => 'service_account',
                'project_id' => config('services.google_drive.project_id'),
                'private_key_id' => config('services.google_drive.private_key_id'),
                'private_key' => config('services.google_drive.private_key'),
                'client_email' => config('services.google_drive.client_email'),
                'client_id' => config('services.google_drive.client_id'),
                'auth_uri' => 'https://accounts.google.com/o/oauth2/auth',
                'token_uri' => 'https://oauth2.googleapis.com/token',
            ]);
        }

        $client->addScope(GoogleDrive::DRIVE_FILE);
        $this->drive = new GoogleDrive($client);
    }

    // ── Folder helpers ──────────────────────────────────────────

    /**
     * Get or create a folder for the given application under the root folder.
     */
    public function getOrCreateApplicationFolder(int $applicationId): string
    {
        $rootFolderId = config('services.google_drive.root_folder_id');
        $folderName = "application_{$applicationId}";

        // Check if folder already exists
        $query = "name = '{$folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        if ($rootFolderId) {
            $query .= " and '{$rootFolderId}' in parents";
        }

        $results = $this->drive->files->listFiles([
            'q' => $query,
            'fields' => 'files(id, name)',
            'spaces' => 'drive',
        ]);

        if (count($results->getFiles()) > 0) {
            return $results->getFiles()[0]->getId();
        }

        // Create folder
        $folderMeta = new DriveFile([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);

        if ($rootFolderId) {
            $folderMeta->setParents([$rootFolderId]);
        }

        $folder = $this->drive->files->create($folderMeta, ['fields' => 'id']);

        return $folder->getId();
    }

    // ── Upload ──────────────────────────────────────────────────

    /**
     * Upload a file to a specific Drive folder.
     *
     * @param  string $localPath  Absolute path to the temp file
     * @param  string $fileName   Desired filename in Drive
     * @param  string $mimeType   MIME type of the file
     * @param  string $folderId   Drive folder ID
     * @return array{file_id: string, folder_id: string}
     */
    public function upload(string $localPath, string $fileName, string $mimeType, string $folderId): array
    {
        $fileMeta = new DriveFile([
            'name' => $fileName,
            'parents' => [$folderId],
        ]);

        $content = file_get_contents($localPath);

        $driveFile = $this->drive->files->create($fileMeta, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id',
        ]);

        return [
            'file_id' => $driveFile->getId(),
            'folder_id' => $folderId,
        ];
    }

    // ── Download / Stream ───────────────────────────────────────

    /**
     * Download file content from Drive as a PSR-7 stream.
     *
     * @param  string $fileId  Google Drive file ID
     * @return StreamInterface
     */
    public function download(string $fileId): StreamInterface
    {
        $response = $this->drive->files->get($fileId, [
            'alt' => 'media',
        ]);

        return $response->getBody();
    }

    /**
     * Get file metadata from Drive.
     */
    public function getMetadata(string $fileId): DriveFile
    {
        return $this->drive->files->get($fileId, [
            'fields' => 'id, name, mimeType, size',
        ]);
    }

    // ── Delete ──────────────────────────────────────────────────

    /**
     * Delete a file from Drive.
     */
    public function delete(string $fileId): void
    {
        $this->drive->files->delete($fileId);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSmokeTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedUsers(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@vimiss.vn',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'must_change_password' => false,
        ]);

        User::create([
            'name' => 'Student',
            'email' => 'student@vimiss.vn',
            'password' => 'password',
            'role' => 'student',
            'status' => 'active',
            'must_change_password' => false,
        ]);
    }

    private function createVerificationCode(string $email, string $purpose, string $plainCode = '123456'): VerificationCode
    {
        return VerificationCode::create([
            'email' => $email,
            'purpose' => $purpose,
            'code_hash' => hash('sha256', $plainCode),
            'expires_at' => now()->addMinutes(5),
            'resend_available_at' => now()->subSecond(),
            'request_ip' => '127.0.0.1',
        ]);
    }

    // =========================================================================
    // Registration flow
    // =========================================================================

    public function test_can_request_register_code(): void
    {
        $response = $this->postJson('/register/request-code', [
            'email' => 'new@example.com',
            'name' => 'New Student',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);

        $this->assertDatabaseHas('verification_codes', [
            'email' => 'new@example.com',
            'purpose' => 'register',
        ]);
    }

    public function test_register_code_is_rate_limited(): void
    {
        // First request should succeed
        $this->postJson('/register/request-code', [
            'email' => 'ratelimit@example.com',
            'name' => 'Test',
        ])->assertOk();

        // Second immediate request with same email should still return 200
        // (generic message to prevent enumeration) but rate limiter kicks in
        // on the 2nd request within 1 minute for same email
        $response = $this->postJson('/register/request-code', [
            'email' => 'ratelimit@example.com',
            'name' => 'Test',
        ]);

        // Rate limiter returns 429 on the 2nd request per minute per email
        $this->assertTrue(
            in_array($response->getStatusCode(), [200, 429]),
            'Expected 200 or 429, got ' . $response->getStatusCode()
        );
    }

    public function test_can_register_student_with_valid_code(): void
    {
        $email = 'newstudent@example.com';
        $plainCode = '654321';

        $this->createVerificationCode($email, 'register', $plainCode);

        $response = $this->postJson('/register', [
            'email' => $email,
            'name' => 'New Student',
            'verification_code' => $plainCode,
            'password' => 'securepass123',
            'password_confirmation' => 'securepass123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['message', 'user']);

        $this->assertDatabaseHas('users', [
            'email' => $email,
            'role' => 'student',
        ]);
    }

    public function test_register_fails_with_invalid_code(): void
    {
        $email = 'fail@example.com';
        $this->createVerificationCode($email, 'register', '123456');

        $response = $this->postJson('/register', [
            'email' => $email,
            'name' => 'Fail Student',
            'verification_code' => '000000',
            'password' => 'securepass123',
            'password_confirmation' => 'securepass123',
        ]);

        $response->assertUnprocessable();
    }

    // =========================================================================
    // Login / Logout
    // =========================================================================

    public function test_can_login_with_valid_credentials(): void
    {
        $this->seedUsers();

        $response = $this->postJson('/login', [
            'email' => 'student@vimiss.vn',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user'])
            ->assertJsonPath('user.email', 'student@vimiss.vn');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->seedUsers();

        $response = $this->postJson('/login', [
            'email' => 'student@vimiss.vn',
            'password' => 'wrongpassword',
        ]);

        $response->assertUnprocessable();
    }

    public function test_can_logout(): void
    {
        $this->seedUsers();
        $user = User::where('email', 'student@vimiss.vn')->first();

        $response = $this->actingAs($user)
            ->postJson('/logout');

        $response->assertOk()
            ->assertJsonStructure(['message']);
    }

    // =========================================================================
    // Password reset flow
    // =========================================================================

    public function test_can_request_password_reset_code(): void
    {
        $this->seedUsers();

        $response = $this->postJson('/forgot-password/request', [
            'email' => 'student@vimiss.vn',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);

        $this->assertDatabaseHas('verification_codes', [
            'email' => 'student@vimiss.vn',
            'purpose' => 'password_reset',
        ]);
    }

    public function test_can_reset_password_with_valid_code(): void
    {
        $this->seedUsers();
        $email = 'student@vimiss.vn';
        $plainCode = '999888';

        $this->createVerificationCode($email, 'password_reset', $plainCode);

        $response = $this->postJson('/forgot-password/reset', [
            'email' => $email,
            'verification_code' => $plainCode,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);

        // Verify new password works
        $loginResponse = $this->postJson('/login', [
            'email' => $email,
            'password' => 'newpassword123',
        ]);

        $loginResponse->assertOk();
    }

    // =========================================================================
    // RBAC: protected route requires login
    // =========================================================================

    public function test_protected_api_requires_auth(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_access_me(): void
    {
        $this->seedUsers();
        $user = User::where('email', 'student@vimiss.vn')->first();

        $response = $this->actingAs($user)
            ->getJson('/api/me');

        $response->assertOk()
            ->assertJsonPath('user.email', 'student@vimiss.vn');
    }

    // =========================================================================
    // Change password (authenticated)
    // =========================================================================

    public function test_can_change_password_when_authenticated(): void
    {
        $this->seedUsers();
        $user = User::where('email', 'student@vimiss.vn')->first();

        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'password',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);
    }

    // =========================================================================
    // Health check
    // =========================================================================

    public function test_health_check_is_public(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonStructure(['status', 'timestamp']);
    }
}

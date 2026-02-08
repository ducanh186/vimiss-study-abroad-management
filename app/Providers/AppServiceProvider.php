<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->registerPolicies();
    }

    protected function registerPolicies(): void
    {
        Gate::policy(User::class, UserPolicy::class);
    }

    protected function configureRateLimiting(): void
    {
        // POST /login: 5/min per IP + email keying
        RateLimiter::for('login', function (HttpRequest $request) {
            $email = strtolower($request->input('email', ''));
            $key = $request->ip() . '|' . $email;
            return Limit::perMinute(5)->by($key);
        });

        // POST /forgot-password/request: 3/min per IP + 1/min per email
        RateLimiter::for('forgot-password-request', function (HttpRequest $request) {
            $ip = $request->ip();
            $email = strtolower($request->input('email', ''));
            return [
                Limit::perMinute(3)->by('forgot-ip:' . $ip),
                Limit::perMinute(1)->by('forgot-email:' . $email),
            ];
        });

        // POST /forgot-password/reset: 5/min per IP + 5/min per email
        RateLimiter::for('forgot-password-reset', function (HttpRequest $request) {
            $ip = $request->ip();
            $email = strtolower($request->input('email', ''));
            return [
                Limit::perMinute(5)->by('reset-ip:' . $ip),
                Limit::perMinute(5)->by('reset-email:' . $email),
            ];
        });
    }
}

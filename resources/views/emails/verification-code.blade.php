@component('mail::message')
# Mã xác thực / Verification Code

@if($purpose === 'register')
Bạn đã yêu cầu mã xác thực để đăng ký tài khoản.

You have requested a verification code to register your account.
@else
Bạn đã yêu cầu đặt lại mật khẩu.

You have requested to reset your password.
@endif

**Mã xác thực / Your code:**

@component('mail::panel')
# {{ $code }}
@endcomponent

Mã này sẽ hết hạn sau **{{ $expiryMinutes }} phút**.

This code will expire in **{{ $expiryMinutes }} minutes**.

Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.

If you did not request this code, please ignore this email.

Trân trọng / Thanks,<br>
{{ config('app.name') }}
@endcomponent

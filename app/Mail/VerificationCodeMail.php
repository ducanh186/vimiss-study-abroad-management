<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose,
        public int $expiryMinutes = 5,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->purpose === 'register'
            ? 'Mã xác thực đăng ký - Vimiss'
            : 'Mã đặt lại mật khẩu - Vimiss';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.verification-code',
            with: [
                'code' => $this->code,
                'purpose' => $this->purpose,
                'expiryMinutes' => $this->expiryMinutes,
            ],
        );
    }
}

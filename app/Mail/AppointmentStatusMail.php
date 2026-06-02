<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Appointment $appointment,
        public string $newStatus,
    ) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'confirmed' => 'Ваш запис підтверджено майстром',
            'done'      => 'Ваш візит завершено — залиште відгук',
            'cancelled' => 'Ваш запис скасовано',
        ];

        return new Envelope(
            subject: $subjects[$this->newStatus] ?? 'Статус вашого запису змінено',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.appointment-status',
            with: [
                'appointment' => $this->appointment,
                'newStatus'   => $this->newStatus,
            ],
        );
    }
}

import { Injectable } from '@angular/core';
import { ContactInquiry, InquirySubmission } from '../models/contact.model';

type InquiryLabels = {
  name: string;
  email: string;
  phone: string;
  weddingType: string;
  date: string;
  guests: string;
  location: string;
  budget: string;
  plusOne: string;
  dietary: string;
  message: string;
};

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly backendApiBase = '';
  private readonly defaultInquiryEmail = 'Eliteweddingsandeventsco1@gmail.com';
  private readonly defaultWhatsAppNumber = '995595930899';

  public whatsAppDirectLink(whatsAppNumber?: string): string {
    return `https://wa.me/${this.normalizeWhatsAppNumber(whatsAppNumber)}`;
  }

  public async submitInquiry(
    submission: InquirySubmission,
    labels: InquiryLabels,
    channel: 'email' | 'whatsapp',
    inquiryEmail?: string,
    whatsAppNumber?: string
  ): Promise<void> {
    const inquiry: ContactInquiry = submission.inquiry;
    const response = await fetch(`${this.backendApiBase}/api/public/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inquiry,
        labels,
        channel,
        honeypot: submission.honeypot,
        formStartedAt: submission.formStartedAt,
        captchaToken: submission.captchaToken,
        targetEmail: inquiryEmail?.trim() || this.defaultInquiryEmail,
        targetWhatsApp: this.normalizeWhatsAppNumber(whatsAppNumber)
      })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to submit inquiry.');
    }
  }

  private buildInquiryBody(inquiry: ContactInquiry, labels: InquiryLabels): string {
    const notProvided = 'Not provided';
    const lines = [
      'Website RSVP - Elite Weddings & Events Co.',
      '',
      `${labels.name}: ${this.valueOrFallback(inquiry.name, notProvided)}`,
      `${labels.email}: ${this.valueOrFallback(inquiry.email, notProvided)}`,
      `${labels.phone}: ${this.valueOrFallback(inquiry.phone, notProvided)}`,
      `${labels.weddingType}: ${this.valueOrFallback(inquiry.weddingType, notProvided)}`,
      `${labels.date}: ${this.valueOrFallback(inquiry.date, notProvided)}`,
      `${labels.guests}: ${this.valueOrFallback(inquiry.guests, notProvided)}`,
      `${labels.location}: ${this.valueOrFallback(inquiry.location, notProvided)}`,
      `${labels.budget}: ${this.valueOrFallback(inquiry.budget, notProvided)}`,
      `${labels.plusOne}: ${this.valueOrFallback(inquiry.plusOne, notProvided)}`,
      `${labels.dietary}: ${this.valueOrFallback(inquiry.dietary, notProvided)}`,
      `${labels.message}:`,
      this.valueOrFallback(inquiry.message, notProvided)
    ];

    return lines.join('\n');
  }

  private valueOrFallback(value: string, fallback: string): string {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  private normalizeWhatsAppNumber(whatsAppNumber?: string): string {
    const normalized = (whatsAppNumber ?? this.defaultWhatsAppNumber).replace(/[^\d]/g, '');
    return normalized.length > 0 ? normalized : this.defaultWhatsAppNumber;
  }
}

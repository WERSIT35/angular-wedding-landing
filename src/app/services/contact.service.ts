import { Injectable } from '@angular/core';
import { ContactInquiry } from '../models/contact.model';

type InquiryLabels = {
  name: string;
  email: string;
  phone: string;
  date: string;
  guests: string;
  plusOne: string;
  dietary: string;
  message: string;
};

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly defaultInquiryEmail = 'Eliteweddingsandeventsco1@gmail.com';
  private readonly defaultWhatsAppNumber = '995595930899';

  public whatsAppDirectLink(whatsAppNumber?: string): string {
    return `https://wa.me/${this.normalizeWhatsAppNumber(whatsAppNumber)}`;
  }

  public buildEmailUrl(inquiry: ContactInquiry, labels: InquiryLabels, inquiryEmail?: string): string {
    const subject = 'Wedding Planning Inquiry - Elite Weddings';
    const body = this.buildInquiryBody(inquiry, labels);
    const targetEmail = inquiryEmail?.trim() || this.defaultInquiryEmail;
    return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  public buildWhatsAppUrl(inquiry: ContactInquiry, labels: InquiryLabels, whatsAppNumber?: string): string {
    const text = this.buildInquiryBody(inquiry, labels);
    return `${this.whatsAppDirectLink(whatsAppNumber)}?text=${encodeURIComponent(text)}`;
  }

  private buildInquiryBody(inquiry: ContactInquiry, labels: InquiryLabels): string {
    const notProvided = 'Not provided';
    const lines = [
      'Website RSVP - Elite Weddings & Events Co.',
      '',
      `${labels.name}: ${this.valueOrFallback(inquiry.name, notProvided)}`,
      `${labels.email}: ${this.valueOrFallback(inquiry.email, notProvided)}`,
      `${labels.phone}: ${this.valueOrFallback(inquiry.phone, notProvided)}`,
      `${labels.date}: ${this.valueOrFallback(inquiry.date, notProvided)}`,
      `${labels.guests}: ${this.valueOrFallback(inquiry.guests, notProvided)}`,
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

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
  private readonly inquiryEmail = 'Eliteweddingsandeventsco1@gmail.com';
  private readonly whatsAppNumber = '995595930899';

  public whatsAppDirectLink(): string {
    return `https://wa.me/${this.whatsAppNumber}`;
  }

  public buildEmailUrl(inquiry: ContactInquiry, labels: InquiryLabels): string {
    const subject = 'Wedding Planning Inquiry - Elite Weddings';
    const body = this.buildInquiryBody(inquiry, labels);
    return `mailto:${this.inquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  public buildWhatsAppUrl(inquiry: ContactInquiry, labels: InquiryLabels): string {
    const text = this.buildInquiryBody(inquiry, labels);
    return `${this.whatsAppDirectLink()}?text=${encodeURIComponent(text)}`;
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
}

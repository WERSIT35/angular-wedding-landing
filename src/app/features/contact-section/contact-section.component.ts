import { Component, input, output } from '@angular/core';
import { SelectOption } from '../../data/event.data';
import { ContactInquiry } from '../../models/contact.model';
import { ContentSection } from '../../models/site-content.model';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  templateUrl: './contact-section.component.html'
})
export class ContactSectionComponent {
  public readonly contact = input.required<ContentSection['contact']>();
  public readonly contactEyebrow = input.required<string>();
  public readonly contactTitle = input.required<string>();
  public readonly contactDescription = input.required<string>();
  public readonly plusOneLabel = input.required<string>();
  public readonly plusOneOptions = input.required<SelectOption[]>();
  public readonly dietaryLabel = input.required<string>();
  public readonly sendByEmailLabel = input.required<string>();
  public readonly sendByWhatsappLabel = input.required<string>();
  public readonly quickContactLabel = input.required<string>();
  public readonly responseTimeLabel = input.required<string>();
  public readonly openWhatsappLabel = input.required<string>();
  public readonly whatsAppDirectLink = input.required<string>();
  public readonly contactEmail = input.required<string>();
  public readonly contactWhatsApp = input.required<string>();
  public readonly inquiryConfirmation = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly emailSubmit = output<ContactInquiry>();
  public readonly whatsappSubmit = output<ContactInquiry>();
  public readonly formInteraction = output<void>();
  public readonly ctaClick = output<string>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onFormInteraction(): void {
    this.formInteraction.emit();
  }

  protected onEmailSubmit(inquiry: ContactInquiry): void {
    if (this.isInlineEditing()) {
      return;
    }
    this.emailSubmit.emit(inquiry);
  }

  protected onWhatsAppSubmit(inquiry: ContactInquiry): void {
    if (this.isInlineEditing()) {
      return;
    }
    this.whatsappSubmit.emit(inquiry);
  }

  protected onContactWhatsappClick(event: MouseEvent): void {
    if (this.isInlineEditing()) {
      event.preventDefault();
      return;
    }
    this.ctaClick.emit('contact-whatsapp');
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

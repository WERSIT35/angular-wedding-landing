import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-sticky-cta',
  standalone: true,
  templateUrl: './sticky-cta.component.html'
})
export class StickyCtaComponent {
  public readonly rsvpNowLabel = input.required<string>();
  public readonly openWhatsappLabel = input.required<string>();
  public readonly whatsAppDirectLink = input.required<string>();

  public readonly ctaClick = output<string>();

  protected onStickyRsvpClick(event: MouseEvent): void {
    event.preventDefault();
    this.ctaClick.emit('sticky-rsvp');
  }

  protected onStickyWhatsappClick(): void {
    this.ctaClick.emit('sticky-whatsapp');
  }
}

import { Component, input, output } from '@angular/core';
import { ContentSection } from '../../models/site-content.model';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  templateUrl: './hero-section.component.html'
})
export class HeroSectionComponent {
  public readonly hero = input.required<ContentSection['hero']>();
  public readonly heroDescriptionHtml = input.required<string>();
  public readonly heroImageSrc = input.required<string>();
  public readonly heroImageAlt = input.required<string>();
  public readonly rsvpNowLabel = input.required<string>();
  public readonly viewDetailsLabel = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly ctaClick = output<string>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onPrimaryCtaClick(): void {
    this.ctaClick.emit('hero-primary');
  }

  protected onSecondaryCtaClick(): void {
    this.ctaClick.emit('hero-secondary');
  }

  protected onPrimaryAction(event: MouseEvent): void {
    event.preventDefault();
    if (this.isInlineEditing()) {
      return;
    }
    this.onPrimaryCtaClick();
  }

  protected onSecondaryAction(event: MouseEvent): void {
    if (this.isInlineEditing()) {
      event.preventDefault();
      return;
    }
    this.onSecondaryCtaClick();
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

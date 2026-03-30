import { Component, input, output } from '@angular/core';
import { ContentSection } from '../../models/site-content.model';

@Component({
  selector: 'app-about-section',
  standalone: true,
  templateUrl: './about-section.component.html'
})
export class AboutSectionComponent {
  public readonly about = input.required<ContentSection['about']>();
  public readonly rsvpNowLabel = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly ctaClick = output<string>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onAboutCtaClick(): void {
    this.ctaClick.emit('about');
  }

  protected onAboutAction(event: MouseEvent): void {
    event.preventDefault();
    if (this.isInlineEditing()) {
      return;
    }
    this.onAboutCtaClick();
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

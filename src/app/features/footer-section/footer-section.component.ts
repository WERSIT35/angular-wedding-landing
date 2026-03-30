import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-footer-section',
  standalone: true,
  templateUrl: './footer-section.component.html'
})
export class FooterSectionComponent {
  public readonly footerTitle = input.required<string>();
  public readonly rsvpNowLabel = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly ctaClick = output<string>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onFooterCtaClick(): void {
    this.ctaClick.emit('footer');
  }

  protected onFooterAction(event: MouseEvent): void {
    event.preventDefault();
    if (this.isInlineEditing()) {
      return;
    }
    this.onFooterCtaClick();
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

import { Component, input, output } from '@angular/core';
import { ContentSection } from '../../models/site-content.model';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  templateUrl: './faq-section.component.html'
})
export class FaqSectionComponent {
  public readonly faq = input.required<ContentSection['faq']>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

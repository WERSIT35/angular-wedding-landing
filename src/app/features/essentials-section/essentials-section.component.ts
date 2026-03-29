import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-essentials-section',
  standalone: true,
  templateUrl: './essentials-section.component.html'
})
export class EssentialsSectionComponent {
  public readonly eventInfoEyebrow = input.required<string>();
  public readonly eventEssentialsTitle = input.required<string>();
  public readonly eventEssentialsDescription = input.required<string>();
  public readonly eventEssentials = input.required<{ label: string; value: string }[]>();
  public readonly eventTimelineTitle = input.required<string>();
  public readonly eventTimeline = input.required<string[]>();
  public readonly openMapLabel = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly openMapClick = output<void>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected onOpenMapClick(): void {
    if (this.isInlineEditing()) {
      return;
    }
    this.openMapClick.emit();
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

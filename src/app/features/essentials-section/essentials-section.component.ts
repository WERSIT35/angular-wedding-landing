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

  /** "5:00 PM - Guest arrival" → time + moment, so the time can be set large. */
  protected splitSlot(slot: string): { time: string; moment: string } {
    const at = slot.indexOf(' - ');
    return at === -1 ? { time: '', moment: slot } : { time: slot.slice(0, at), moment: slot.slice(at + 3) };
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

import { Component, input, output } from '@angular/core';
import { photoSrc, photoSrcset } from '../../utils/photo';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  templateUrl: './gallery-section.component.html'
})
export class GallerySectionComponent {
  public readonly galleryEyebrow = input.required<string>();
  public readonly galleryTitle = input.required<string>();
  public readonly galleryPhotos = input.required<{ src: string; alt: string }[]>();
  public readonly isInlineEditing = input<boolean>(false);
  public readonly inlineEdit = output<{ path: string; value: string }>();

  protected readonly photoSrc = photoSrc;
  protected readonly photoSrcset = photoSrcset;

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }
}

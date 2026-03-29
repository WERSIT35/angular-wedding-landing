import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output } from '@angular/core';
import Splide from '@splidejs/splide';
import { Grid } from '@splidejs/splide-extension-grid';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  templateUrl: './gallery-section.component.html'
})
export class GallerySectionComponent implements AfterViewInit, OnDestroy {
  public readonly galleryEyebrow = input.required<string>();
  public readonly galleryTitle = input.required<string>();
  public readonly galleryPhotos = input.required<{ src: string; alt: string }[]>();
  public readonly isInlineEditing = input<boolean>(false);
  public readonly inlineEdit = output<{ path: string; value: string }>();
  @ViewChild('gallerySlider', { static: false }) private gallerySlider?: ElementRef<HTMLElement>;

  private splide: Splide | null = null;
  private viewReady = false;

  private readonly rebuildSliderEffect = effect(() => {
    this.galleryPhotos();
    this.galleryTitle();

    if (!this.viewReady) {
      return;
    }

    this.rebuildSlider();
  });

  public ngAfterViewInit(): void {
    this.viewReady = true;
    this.rebuildSlider();
  }

  private rebuildSlider(): void {
    const target = this.gallerySlider?.nativeElement;
    if (!target) {
      return;
    }

    this.splide?.destroy(true);
    this.splide = new Splide(target, {
      type: 'slide',
      rewind: false,
      height: '30rem',
      perPage: 1,
      perMove: 1,
      gap: '1rem',
      arrows: true,
      pagination: true,
      autoplay: true,
      interval: 3600,
      pauseOnHover: true,
      grid: {
        dimensions: [
          [2, 2],
          [1, 2],
          [1, 1],
          [1, 1],
          [1, 2],
          [1, 1],
          [2, 1]
        ],
        gap: {
          row: '10px',
          col: '10px'
        }
      },
      breakpoints: {
        900: {
          height: '20rem',
          perPage: 1,
          grid: {
            dimensions: [
              [2, 2],
              [1, 2],
              [1, 1],
              [1, 1],
              [1, 2]
            ],
            gap: {
              row: '8px',
              col: '8px'
            }
          }
        }
      }
    });
    this.splide.mount({ Grid });
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }

  public ngOnDestroy(): void {
    this.splide?.destroy(true);
    this.rebuildSliderEffect.destroy();
  }
}

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  public track(
    targetWindow: Window | null,
    eventName: string,
    params: Record<string, string | number | boolean>
  ): void {
    if (!targetWindow) {
      return;
    }

    const typedWindow = targetWindow as Window & {
      dataLayer?: Record<string, unknown>[];
    };

    const payload: Record<string, unknown> = { event: eventName, ...params };
    typedWindow.dataLayer = typedWindow.dataLayer ?? [];
    typedWindow.dataLayer.push(payload);
  }
}

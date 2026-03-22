import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  EVENT_ESSENTIALS,
  EVENT_TIMELINE,
  GALLERY_PHOTOS,
  MAP_LINK,
  PLUS_ONE_OPTIONS,
  PRIMARY_NAV_ITEMS,
  SelectOption
} from './data/event.data';
import { CONTENT } from './data/site-content.data';
import { ContactInquiry } from './models/contact.model';
import { Language, NavItem } from './models/site-content.model';
import { AnalyticsService } from './services/analytics.service';
import { ContactService } from './services/contact.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly contactService = inject(ContactService);

  private hasTrackedRsvpStart = false;

  protected readonly currentLanguage = signal<Language>('en');
  protected readonly content = computed(() => CONTENT[this.currentLanguage()]);
  protected readonly inquiryConfirmation = signal('');

  public constructor() {
    effect(() => {
      const language = this.currentLanguage();
      this.document.body.classList.toggle('lang-ka', language === 'ka');
      this.document.body.classList.toggle('lang-en', language === 'en');
      this.document.documentElement.lang = language;
    });
  }

  protected setLanguage(language: Language): void {
    this.currentLanguage.set(language);
  }

  protected headingText(text: string): string {
    return text;
  }

  protected heroDescriptionHtml(): string {
    const description = this.content().hero.description;
    if (this.currentLanguage() !== 'ka') {
      return description;
    }

    return description.replace(
      'Elite Weddings & Events Co.',
      '<span class="inline-logo-font" lang="en">Elite Weddings & Events Co.</span>'
    );
  }

  protected primaryNavItems(): NavItem[] {
    return PRIMARY_NAV_ITEMS;
  }

  protected eventEssentialsTitle(): string {
    return 'Event essentials';
  }

  protected eventEssentialsDescription(): string {
    return 'Everything guests need at a glance: date, time, location, dress code, and timeline.';
  }

  protected eventEssentials(): { label: string; value: string }[] {
    return EVENT_ESSENTIALS;
  }

  protected eventTimelineTitle(): string {
    return 'Wedding day timeline';
  }

  protected eventTimeline(): string[] {
    return EVENT_TIMELINE;
  }

  protected galleryPhotos(): { src: string; alt: string }[] {
    return GALLERY_PHOTOS;
  }

  protected plusOneLabel(): string {
    return 'Plus one';
  }

  protected quickContactLabel(): string {
    return 'Quick contact';
  }

  protected dietaryLabel(): string {
    return 'Dietary preferences';
  }

  protected plusOneOptions(): SelectOption[] {
    return PLUS_ONE_OPTIONS;
  }

  protected whatsAppDirectLink(): string {
    return this.contactService.whatsAppDirectLink();
  }

  protected openMap(): void {
    this.trackEvent('map_click', { placement: 'event-essentials' });
    this.openInNewTab(MAP_LINK);
  }

  protected onCtaClick(placement: string): void {
    this.trackEvent('cta_click', { placement });
  }

  protected onRsvpFormInteraction(): void {
    if (this.hasTrackedRsvpStart) {
      return;
    }

    this.hasTrackedRsvpStart = true;
    this.trackEvent('rsvp_start', { source: 'contact_form' });
  }

  protected sendInquiryByEmail(inquiry: ContactInquiry): void {
    this.onRsvpFormInteraction();

    const contactLabels = this.content().contact.labels;
    const labels = {
      name: contactLabels.name,
      email: contactLabels.email,
      phone: contactLabels.phone,
      date: contactLabels.date,
      guests: contactLabels.guests,
      plusOne: this.plusOneLabel(),
      dietary: this.dietaryLabel(),
      message: contactLabels.message
    };
    const mailToUrl = this.contactService.buildEmailUrl(inquiry, labels);

    this.inquiryConfirmation.set('Ready to send. Your email app will open now.');
    this.trackEvent('rsvp_complete', { channel: 'email' });
    this.navigateTo(mailToUrl);
  }

  protected sendInquiryByWhatsApp(inquiry: ContactInquiry): void {
    this.onRsvpFormInteraction();

    const contactLabels = this.content().contact.labels;
    const labels = {
      name: contactLabels.name,
      email: contactLabels.email,
      phone: contactLabels.phone,
      date: contactLabels.date,
      guests: contactLabels.guests,
      plusOne: this.plusOneLabel(),
      dietary: this.dietaryLabel(),
      message: contactLabels.message
    };
    const whatsAppUrl = this.contactService.buildWhatsAppUrl(inquiry, labels);

    this.inquiryConfirmation.set('Ready to send. WhatsApp chat will open now.');
    this.trackEvent('rsvp_complete', { channel: 'whatsapp' });
    this.openInNewTab(whatsAppUrl);
  }

  private trackEvent(
    eventName: string,
    params: Record<string, string | number | boolean>
  ): void {
    this.analyticsService.track(this.document.defaultView, eventName, params);
  }

  private navigateTo(url: string): void {
    const defaultView = this.document.defaultView;
    if (!defaultView) {
      return;
    }

    defaultView.location.href = url;
  }

  private openInNewTab(url: string): void {
    const defaultView = this.document.defaultView;
    if (!defaultView) {
      return;
    }

    defaultView.open(url, '_blank', 'noopener,noreferrer');
  }
}

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
    if (this.currentLanguage() === 'ka') {
      return [
        { label: 'მთავარი', href: '#home' },
        { label: 'დეტალები', href: '#essentials' },
        { label: 'ჩვენ შესახებ', href: '#about' },
        { label: 'FAQ', href: '#faq' },
        { label: 'კონტაქტი', href: '#contact' }
      ];
    }

    return PRIMARY_NAV_ITEMS;
  }

  protected eventEssentialsTitle(): string {
    return this.currentLanguage() === 'ka' ? 'მთავარი დეტალები' : 'Event essentials';
  }

  protected eventEssentialsDescription(): string {
    return this.currentLanguage() === 'ka'
      ? 'სტუმრებისთვის საჭირო ყველაფერი ერთ ეკრანზე: თარიღი, დრო, ლოკაცია, დრეს კოდი და ტაიმლაინი.'
      : 'Everything guests need at a glance: date, time, location, dress code, and timeline.';
  }

  protected eventEssentials(): { label: string; value: string }[] {
    if (this.currentLanguage() === 'ka') {
      return [
        { label: 'თარიღი', value: '12 სექტემბერი, 2026' },
        { label: 'დრო', value: '17:00 ცერემონია, 19:00 მიღება' },
        { label: 'ლოკაცია', value: 'Wedding Palace, თბილისი' },
        { label: 'დრეს კოდი', value: 'Formal / Black tie optional' }
      ];
    }

    return EVENT_ESSENTIALS;
  }

  protected eventTimelineTitle(): string {
    return this.currentLanguage() === 'ka' ? 'დღის ტაიმლაინი' : 'Wedding day timeline';
  }

  protected eventTimeline(): string[] {
    if (this.currentLanguage() === 'ka') {
      return [
        '17:00 - სტუმრების მიღება',
        '17:30 - ცერემონია',
        '19:00 - ვახშამი',
        '21:00 - წვეულება'
      ];
    }

    return EVENT_TIMELINE;
  }

  protected galleryPhotos(): { src: string; alt: string }[] {
    return GALLERY_PHOTOS;
  }

  protected plusOneLabel(): string {
    return this.currentLanguage() === 'ka' ? 'პლუს ერთი' : 'Plus one';
  }

  protected quickContactLabel(): string {
    return this.currentLanguage() === 'ka' ? 'სწრაფი კონტაქტი' : 'Quick contact';
  }

  protected dietaryLabel(): string {
    return this.currentLanguage() === 'ka' ? 'კვებითი შეზღუდვები' : 'Dietary preferences';
  }

  protected plusOneOptions(): SelectOption[] {
    if (this.currentLanguage() === 'ka') {
      return [
        { value: '', label: 'აირჩიეთ' },
        { value: 'Yes', label: 'კი' },
        { value: 'No', label: 'არა' },
        { value: 'Maybe', label: 'შესაძლოა' }
      ];
    }

    return PLUS_ONE_OPTIONS;
  }

  protected rsvpNowLabel(): string {
    return this.currentLanguage() === 'ka' ? 'RSVP ახლავე' : 'RSVP now';
  }

  protected viewDetailsLabel(): string {
    return this.currentLanguage() === 'ka' ? 'დეტალების ნახვა' : 'View details';
  }

  protected eventInfoEyebrow(): string {
    return this.currentLanguage() === 'ka' ? 'ღონისძიების ინფორმაცია' : 'Event info';
  }

  protected openMapLabel(): string {
    return this.currentLanguage() === 'ka' ? 'ლოკაციის რუკის გახსნა' : 'Open venue map';
  }

  protected galleryEyebrow(): string {
    return this.currentLanguage() === 'ka' ? 'გალერეა' : 'Gallery';
  }

  protected galleryTitle(): string {
    return this.currentLanguage() === 'ka'
      ? 'მომენტები რეალური ღონისძიებებიდან'
      : 'Moments from real celebrations';
  }

  protected contactEyebrow(): string {
    return this.currentLanguage() === 'ka' ? 'კონტაქტი და RSVP' : 'Contact & RSVP';
  }

  protected contactTitle(): string {
    return this.currentLanguage() === 'ka' ? 'RSVP 30 წამში' : 'RSVP in 30 seconds';
  }

  protected contactDescription(): string {
    return this.currentLanguage() === 'ka'
      ? 'მოკლე ფორმა, მყისიერი გაგზავნა ელფოსტით ან WhatsApp-ით.'
      : 'Short form, instant send via email or WhatsApp.';
  }

  protected sendByEmailLabel(): string {
    return this.currentLanguage() === 'ka' ? 'RSVP გაგზავნა ელფოსტაზე' : 'Send RSVP by email';
  }

  protected sendByWhatsappLabel(): string {
    return this.currentLanguage() === 'ka'
      ? 'RSVP გაგზავნა WhatsApp-ზე'
      : 'Send RSVP by WhatsApp';
  }

  protected responseTimeLabel(): string {
    return this.currentLanguage() === 'ka' ? 'პასუხის დრო: 24 საათში' : 'Response time: within 24 hours';
  }

  protected openWhatsappLabel(): string {
    return this.currentLanguage() === 'ka' ? 'WhatsApp გახსნა' : 'Open WhatsApp';
  }

  protected footerTitle(): string {
    return this.currentLanguage() === 'ka'
      ? 'მზად ხართ აღსანიშნავად ჩვენთან ერთად?'
      : 'Ready to celebrate with us?';
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

    this.inquiryConfirmation.set(
      this.currentLanguage() === 'ka'
        ? 'მზად არის. თქვენი ელფოსტის აპი ახლა გაიხსნება.'
        : 'Ready to send. Your email app will open now.'
    );
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

    this.inquiryConfirmation.set(
      this.currentLanguage() === 'ka'
        ? 'მზად არის. WhatsApp ჩატი ახლა გაიხსნება.'
        : 'Ready to send. WhatsApp chat will open now.'
    );
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

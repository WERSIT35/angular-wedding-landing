import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
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
import { AboutSectionComponent } from './features/about-section/about-section.component';
import { ContactSectionComponent } from './features/contact-section/contact-section.component';
import { EssentialsSectionComponent } from './features/essentials-section/essentials-section.component';
import { FaqSectionComponent } from './features/faq-section/faq-section.component';
import { FooterSectionComponent } from './features/footer-section/footer-section.component';
import { GallerySectionComponent } from './features/gallery-section/gallery-section.component';
import { HeaderComponent } from './features/header/header.component';
import { HeroSectionComponent } from './features/hero-section/hero-section.component';
import { StickyCtaComponent } from './features/sticky-cta/sticky-cta.component';
import { ContactInquiry } from './models/contact.model';
import { ContentSection, Language, NavItem } from './models/site-content.model';
import { AnalyticsService } from './services/analytics.service';
import { ContactService } from './services/contact.service';

type AdminUser = {
  id: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroSectionComponent,
    EssentialsSectionComponent,
    AboutSectionComponent,
    GallerySectionComponent,
    FaqSectionComponent,
    ContactSectionComponent,
    FooterSectionComponent,
    StickyCtaComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  encapsulation: ViewEncapsulation.None
})
export class App implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly contactService = inject(ContactService);

  private hasTrackedRsvpStart = false;
  private readonly adminApiBase = 'http://localhost:4000';
  private readonly defaultContactEmail = 'Eliteweddingsandeventsco1@gmail.com';
  private readonly defaultContactWhatsApp = '+995 595 930 899';
  private readonly defaultWhatsAppNumber = '995595930899';

  protected readonly currentLanguage = signal<Language>('en');
  private readonly remoteContent = signal<Partial<Record<Language, ContentSection>> | null>(null);
  protected readonly content = computed(() => this.resolvedContent(this.currentLanguage()));
  protected readonly inquiryConfirmation = signal('');
  protected readonly isAdminModalOpen = signal(false);
  protected readonly isAdminAuthenticated = signal(false);
  protected readonly isAdminEditing = signal(false);
  protected readonly adminAuthMessage = signal('');
  protected readonly isMfaStep = signal(false);
  protected readonly isAdminManagerOpen = signal(false);
  protected readonly adminManagerTab = signal<'profile' | 'users'>('profile');
  protected readonly adminProfile = signal<AdminUser | null>(null);
  protected readonly adminUsers = signal<AdminUser[]>([]);
  protected readonly adminManagerMessage = signal('');
  protected readonly adminUsersFilter = signal('');
  protected readonly hasUnsavedAdminChanges = signal(false);
  protected readonly mfaSetup = signal<{ otpauthUrl: string; recoveryCodes: string[] } | null>(null);
  protected readonly activeInlineEditor = signal<
    'hero' | 'essentials' | 'about' | 'gallery' | 'faq' | 'contact' | 'footer' | null
  >(null);
  private adminTempToken = '';
  private adminAccessToken = '';

  public constructor() {
    effect(() => {
      const language = this.currentLanguage();
      this.document.body.classList.toggle('lang-ka', language === 'ka');
      this.document.body.classList.toggle('lang-en', language === 'en');
      this.document.documentElement.lang = language;
    });

    void this.loadRemoteContent();
    this.initRevealMotion();

    const storedToken = this.document.defaultView?.sessionStorage.getItem('landing_admin_access_token');
    if (storedToken) {
      this.adminAccessToken = storedToken;
      this.isAdminAuthenticated.set(true);
      this.isAdminEditing.set(true);
      void this.loadAdminManagerData();
    }

    this.document.defaultView?.addEventListener('keydown', this.onAdminShortcut);
    this.document.defaultView?.addEventListener('keydown', this.onEscapeClose);
  }

  private async loadRemoteContent(): Promise<void> {
    const endpoints = ['http://localhost:4000/api/public/content'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as {
          content?: Partial<Record<Language, ContentSection>> | null;
        };

        if (data.content && typeof data.content === 'object') {
          this.remoteContent.set(data.content);
          return;
        }
      } catch {
        // Keep trying fallback endpoints.
      }
    }
  }

  private initRevealMotion(): void {
    const defaultView = this.document.defaultView;
    if (!defaultView || !('IntersectionObserver' in defaultView)) {
      return;
    }

    defaultView.requestAnimationFrame(() => {
      const sections = this.document.querySelectorAll<HTMLElement>(
        'main .section:not(.contact-section), .hero-section, .site-footer'
      );
      const observer = new defaultView.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.2 }
      );

      sections.forEach((section) => {
        section.classList.add('reveal-on-scroll');
        observer.observe(section);
      });
    });
  }

  private readonly onAdminShortcut = (event: KeyboardEvent): void => {
    if (!(event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e')) {
      return;
    }

    event.preventDefault();
    if (this.isAdminAuthenticated()) {
      this.isAdminEditing.update((value) => !value);
      return;
    }

    this.isAdminModalOpen.set(true);
    this.adminAuthMessage.set('');
    this.isMfaStep.set(false);
  };

  private readonly onEscapeClose = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }

    if (this.isAdminManagerOpen()) {
      this.closeAdminManager();
      return;
    }

    if (this.isAdminModalOpen()) {
      this.closeAdminModal();
      return;
    }
  };

  public ngOnDestroy(): void {
    this.document.defaultView?.removeEventListener('keydown', this.onAdminShortcut);
    this.document.defaultView?.removeEventListener('keydown', this.onEscapeClose);
  }

  protected setLanguage(language: Language): void {
    this.currentLanguage.set(language);
  }

  protected closeAdminModal(): void {
    this.isAdminModalOpen.set(false);
    this.isMfaStep.set(false);
    this.adminAuthMessage.set('');
    this.adminTempToken = '';
  }

  protected async loginAsAdmin(email: string, password: string): Promise<void> {
    this.adminAuthMessage.set('Signing in...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = (await response.json()) as {
        mfaRequired?: boolean;
        tempToken?: string;
        accessToken?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed.');
      }

      if (payload.mfaRequired && payload.tempToken) {
        this.adminTempToken = payload.tempToken;
        this.isMfaStep.set(true);
        this.adminAuthMessage.set('MFA required. Enter your authenticator code.');
        return;
      }

      if (!payload.accessToken) {
        throw new Error('Missing access token.');
      }

      this.finishAdminLogin(payload.accessToken);
    } catch (error) {
      this.adminAuthMessage.set(error instanceof Error ? error.message : 'Login failed.');
    }
  }

  protected async verifyAdminMfa(code: string): Promise<void> {
    this.adminAuthMessage.set('Verifying MFA...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: this.adminTempToken, code })
      });
      const payload = (await response.json()) as {
        accessToken?: string;
        error?: string;
      };

      if (!response.ok || !payload.accessToken) {
        throw new Error(payload.error || 'Invalid MFA code.');
      }

      this.finishAdminLogin(payload.accessToken);
    } catch (error) {
      this.adminAuthMessage.set(error instanceof Error ? error.message : 'MFA verification failed.');
    }
  }

  protected logoutAdmin(): void {
    this.adminAccessToken = '';
    this.adminTempToken = '';
    this.isAdminAuthenticated.set(false);
    this.isAdminEditing.set(false);
    this.isAdminManagerOpen.set(false);
    this.adminProfile.set(null);
    this.adminUsers.set([]);
    this.adminUsersFilter.set('');
    this.mfaSetup.set(null);
    this.document.defaultView?.sessionStorage.removeItem('landing_admin_access_token');
  }

  protected async saveAdminEdits(): Promise<void> {
    if (!this.adminAccessToken) {
      this.adminAuthMessage.set('No admin session. Login again.');
      return;
    }

    const payloadContent = {
      en: this.resolvedContent('en'),
      ka: this.resolvedContent('ka')
    };

    this.adminAuthMessage.set('Saving...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        },
        body: JSON.stringify({ content: payloadContent })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Save failed.');
      }

      this.adminAuthMessage.set('Saved successfully.');
      this.hasUnsavedAdminChanges.set(false);
    } catch (error) {
      this.adminAuthMessage.set(error instanceof Error ? error.message : 'Save failed.');
    }
  }

  protected openAdminManager(tab: 'profile' | 'users'): void {
    this.adminManagerTab.set(tab);
    this.isAdminManagerOpen.set(true);
    this.adminManagerMessage.set('');
    void this.loadAdminManagerData();
  }

  protected closeAdminManager(): void {
    this.isAdminManagerOpen.set(false);
    this.adminManagerMessage.set('');
    this.mfaSetup.set(null);
  }

  protected async saveAdminProfile(oldPassword: string, password: string): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    if (password && !oldPassword) {
      this.adminManagerMessage.set('Enter your current password to set a new password.');
      return;
    }

    const effectiveEmail = this.adminProfile()?.email || '';
    this.adminManagerMessage.set('Saving profile...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        },
        body: JSON.stringify({ email: effectiveEmail, oldPassword, password })
      });
      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || 'Profile save failed.');
      }
      this.adminProfile.set(payload.user);
      this.adminManagerMessage.set('Profile saved.');
      await this.loadAdminUsers();
    } catch (error) {
      this.adminManagerMessage.set(error instanceof Error ? error.message : 'Profile save failed.');
    }
  }

  protected async setupAdminMfa(): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    this.adminManagerMessage.set('Setting up authenticator...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        }
      });
      const payload = (await response.json()) as {
        otpauthUrl?: string;
        recoveryCodes?: string[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'MFA setup failed.');
      }

      this.mfaSetup.set({
        otpauthUrl: payload.otpauthUrl ?? '',
        recoveryCodes: payload.recoveryCodes ?? []
      });
      this.adminManagerMessage.set('Authenticator enabled. Save your recovery codes now.');
      await this.loadAdminManagerData();
    } catch (error) {
      this.adminManagerMessage.set(error instanceof Error ? error.message : 'MFA setup failed.');
    }
  }

  protected async createAdminUser(email: string, password: string): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    this.adminManagerMessage.set('Creating user...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        },
        body: JSON.stringify({ email, password })
      });
      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || 'User create failed.');
      }
      this.adminManagerMessage.set('User created.');
      await this.loadAdminUsers();
    } catch (error) {
      this.adminManagerMessage.set(error instanceof Error ? error.message : 'User create failed.');
    }
  }

  protected async updateAdminUser(
    id: string,
    email: string,
    password: string,
    disableMfa: boolean
  ): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    this.adminManagerMessage.set('Updating user...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        },
        body: JSON.stringify({
          id,
          email,
          password,
          mfaEnabled: disableMfa ? false : undefined
        })
      });
      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || 'User update failed.');
      }
      this.adminManagerMessage.set('User updated.');
      await this.loadAdminUsers();
      await this.loadAdminProfile();
    } catch (error) {
      this.adminManagerMessage.set(error instanceof Error ? error.message : 'User update failed.');
    }
  }

  protected async deleteAdminUser(id: string): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    if (this.adminProfile()?.id === id) {
      this.adminManagerMessage.set('You cannot delete your own active admin account.');
      return;
    }

    this.adminManagerMessage.set('Deleting user...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.adminAccessToken}`
        }
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'User delete failed.');
      }
      this.adminManagerMessage.set('User deleted.');
      await this.loadAdminUsers();
    } catch (error) {
      this.adminManagerMessage.set(error instanceof Error ? error.message : 'User delete failed.');
    }
  }

  protected refreshAdminUsers(): void {
    void this.loadAdminUsers();
  }

  protected filteredAdminUsers(): AdminUser[] {
    const filter = this.adminUsersFilter().trim().toLowerCase();
    const sorted = [...this.adminUsers()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!filter) {
      return sorted;
    }
    return sorted.filter((user) => user.email.toLowerCase().includes(filter));
  }

  protected formatAdminDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  protected confirmDeleteAdminUser(id: string, email: string): void {
    const shouldDelete = this.document.defaultView?.confirm(`Delete user "${email}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }
    void this.deleteAdminUser(id);
  }

  protected async copyText(value: string, successMessage: string): Promise<void> {
    if (!value) {
      return;
    }

    try {
      await this.document.defaultView?.navigator.clipboard.writeText(value);
      this.adminManagerMessage.set(successMessage);
    } catch {
      this.adminManagerMessage.set('Copy failed. Please copy manually.');
    }
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

  protected heroImageSrc(): string {
    return this.content().landing?.heroImageSrc ?? '/assets/images/L2D100242.JPG';
  }

  protected heroImageAlt(): string {
    return this.content().landing?.heroImageAlt ?? 'Wedding couple and guests during golden-hour ceremony';
  }

  protected primaryNavItems(): NavItem[] {
    const editableItems = this.content().navItems;
    if (editableItems.length > 0) {
      return editableItems;
    }

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
    return this.content().landing?.eventEssentialsTitle
      ?? (this.currentLanguage() === 'ka' ? 'მთავარი დეტალები' : 'Event essentials');
  }

  protected eventEssentialsDescription(): string {
    return this.content().landing?.eventEssentialsDescription
      ?? (this.currentLanguage() === 'ka'
        ? 'სტუმრებისთვის საჭირო ყველაფერი ერთ ეკრანზე: თარიღი, დრო, ლოკაცია, დრეს კოდი და ტაიმლაინი.'
        : 'Everything guests need at a glance: date, time, location, dress code, and timeline.');
  }

  protected eventEssentials(): { label: string; value: string }[] {
    const editableEssentials = this.content().landing?.eventEssentials;
    if (editableEssentials?.length) {
      return editableEssentials;
    }

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
    return this.content().landing?.eventTimelineTitle
      ?? (this.currentLanguage() === 'ka' ? 'დღის ტაიმლაინი' : 'Wedding day timeline');
  }

  protected eventTimeline(): string[] {
    const editableTimeline = this.content().landing?.eventTimeline;
    if (editableTimeline?.length) {
      return editableTimeline;
    }

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
    const editablePhotos = this.content().landing?.galleryPhotos;
    return editablePhotos?.length ? editablePhotos : GALLERY_PHOTOS;
  }

  protected plusOneLabel(): string {
    return this.content().landing?.plusOneLabel
      ?? (this.currentLanguage() === 'ka' ? 'პლუს ერთი' : 'Plus one');
  }

  protected quickContactLabel(): string {
    return this.content().landing?.quickContactLabel
      ?? (this.currentLanguage() === 'ka' ? 'სწრაფი კონტაქტი' : 'Quick contact');
  }

  protected dietaryLabel(): string {
    return this.content().landing?.dietaryLabel
      ?? (this.currentLanguage() === 'ka' ? 'კვებითი შეზღუდვები' : 'Dietary preferences');
  }

  protected plusOneOptions(): SelectOption[] {
    const editableOptions = this.content().landing?.plusOneOptions;
    if (editableOptions?.length) {
      return editableOptions;
    }

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
    return this.content().landing?.rsvpNowLabel
      ?? (this.currentLanguage() === 'ka' ? 'RSVP ახლავე' : 'RSVP now');
  }

  protected viewDetailsLabel(): string {
    return this.content().landing?.viewDetailsLabel
      ?? (this.currentLanguage() === 'ka' ? 'დეტალების ნახვა' : 'View details');
  }

  protected eventInfoEyebrow(): string {
    return this.content().landing?.eventInfoEyebrow
      ?? (this.currentLanguage() === 'ka' ? 'ღონისძიების ინფორმაცია' : 'Event info');
  }

  protected openMapLabel(): string {
    return this.content().landing?.openMapLabel
      ?? (this.currentLanguage() === 'ka' ? 'ლოკაციის რუკის გახსნა' : 'Open venue map');
  }

  protected galleryEyebrow(): string {
    return this.content().landing?.galleryEyebrow
      ?? (this.currentLanguage() === 'ka' ? 'გალერეა' : 'Gallery');
  }

  protected galleryTitle(): string {
    return this.content().landing?.galleryTitle
      ?? (this.currentLanguage() === 'ka'
        ? 'მომენტები რეალური ღონისძიებებიდან'
        : 'Moments from real celebrations');
  }

  protected contactEyebrow(): string {
    return this.content().landing?.contactEyebrow
      ?? (this.currentLanguage() === 'ka' ? 'კონტაქტი და RSVP' : 'Contact & RSVP');
  }

  protected contactTitle(): string {
    return this.content().landing?.contactTitle
      ?? (this.currentLanguage() === 'ka' ? 'RSVP 30 წამში' : 'RSVP in 30 seconds');
  }

  protected contactDescription(): string {
    return this.content().landing?.contactDescription
      ?? (this.currentLanguage() === 'ka'
        ? 'მოკლე ფორმა, მყისიერი გაგზავნა ელფოსტით ან WhatsApp-ით.'
        : 'Short form, instant send via email or WhatsApp.');
  }

  protected sendByEmailLabel(): string {
    return this.content().landing?.sendByEmailLabel
      ?? (this.currentLanguage() === 'ka' ? 'RSVP გაგზავნა ელფოსტაზე' : 'Send RSVP by email');
  }

  protected sendByWhatsappLabel(): string {
    return this.content().landing?.sendByWhatsappLabel
      ?? (this.currentLanguage() === 'ka'
        ? 'RSVP გაგზავნა WhatsApp-ზე'
        : 'Send RSVP by WhatsApp');
  }

  protected responseTimeLabel(): string {
    return this.content().landing?.responseTimeLabel
      ?? (this.currentLanguage() === 'ka' ? 'პასუხის დრო: 24 საათში' : 'Response time: within 24 hours');
  }

  protected openWhatsappLabel(): string {
    return this.content().landing?.openWhatsappLabel
      ?? (this.currentLanguage() === 'ka' ? 'WhatsApp გახსნა' : 'Open WhatsApp');
  }

  protected footerTitle(): string {
    return this.content().landing?.footerTitle
      ?? (this.currentLanguage() === 'ka'
        ? 'მზად ხართ აღსანიშნავად ჩვენთან ერთად?'
        : 'Ready to celebrate with us?');
  }

  protected editHeroSection(): void {
    this.toggleInlineEditor('hero');
  }

  protected editEssentialsSection(): void {
    this.toggleInlineEditor('essentials');
  }

  protected editAboutSection(): void {
    this.toggleInlineEditor('about');
  }

  protected editGallerySection(): void {
    this.toggleInlineEditor('gallery');
  }

  protected editFaqSection(): void {
    this.toggleInlineEditor('faq');
  }

  protected editContactSection(): void {
    this.toggleInlineEditor('contact');
  }

  protected editFooterSection(): void {
    this.toggleInlineEditor('footer');
  }

  protected closeInlineEditor(): void {
    this.activeInlineEditor.set(null);
  }

  protected updateInlineText(path: string, value: string): void {
    this.setContentPath(path, value);
    this.hasUnsavedAdminChanges.set(true);
  }

  protected updateInlineGalleryJson(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as { src: string; alt: string }[];
      this.setContentPath('landing.galleryPhotos', parsed);
      this.hasUnsavedAdminChanges.set(true);
      this.adminAuthMessage.set('');
    } catch {
      this.adminAuthMessage.set('Gallery JSON is invalid.');
    }
  }

  private toggleInlineEditor(
    section: 'hero' | 'essentials' | 'about' | 'gallery' | 'faq' | 'contact' | 'footer'
  ): void {
    this.activeInlineEditor.update((current) => (current === section ? null : section));
  }

  protected whatsAppDirectLink(): string {
    return this.contactService.whatsAppDirectLink(this.contactWhatsAppNumber());
  }

  protected contactEmail(): string {
    return this.content().contact.channels?.email ?? this.defaultContactEmail;
  }

  protected contactWhatsApp(): string {
    return this.content().contact.channels?.whatsapp ?? this.defaultContactWhatsApp;
  }

  protected openMap(): void {
    this.trackEvent('map_click', { placement: 'event-essentials' });
    this.openInNewTab(this.content().landing?.mapLink ?? MAP_LINK);
  }

  protected onCtaClick(placement: string): void {
    this.trackEvent('cta_click', { placement });
    if (this.shouldOpenWizardFromCta(placement)) {
      this.document.defaultView?.dispatchEvent(new CustomEvent('open-wedding-wizard'));
    }
  }

  protected onRsvpFormInteraction(): void {
    if (this.hasTrackedRsvpStart) {
      return;
    }

    this.hasTrackedRsvpStart = true;
    this.trackEvent('rsvp_start', { source: 'contact_form' });
  }

  protected async sendInquiryByEmail(inquiry: ContactInquiry): Promise<void> {
    this.onRsvpFormInteraction();

    const contactLabels = this.content().contact.labels;
    const labels = {
      name: contactLabels.name,
      email: contactLabels.email,
      phone: contactLabels.phone,
      weddingType: contactLabels.weddingType,
      date: contactLabels.date,
      guests: contactLabels.guests,
      location: contactLabels.location,
      budget: contactLabels.budget,
      plusOne: this.plusOneLabel(),
      dietary: this.dietaryLabel(),
      message: contactLabels.message
    };

    this.inquiryConfirmation.set('Submitting your inquiry...');
    try {
      await this.contactService.submitInquiry(
        inquiry,
        labels,
        'email',
        this.contactEmail(),
        this.contactWhatsAppNumber()
      );
      this.inquiryConfirmation.set('Your details were sent successfully. Thank you.');
      this.trackEvent('rsvp_complete', { channel: 'email' });
    } catch (error) {
      this.inquiryConfirmation.set(
        error instanceof Error ? error.message : 'Failed to submit inquiry.'
      );
    }
  }

  protected async sendInquiryByWhatsApp(inquiry: ContactInquiry): Promise<void> {
    this.onRsvpFormInteraction();

    const contactLabels = this.content().contact.labels;
    const labels = {
      name: contactLabels.name,
      email: contactLabels.email,
      phone: contactLabels.phone,
      weddingType: contactLabels.weddingType,
      date: contactLabels.date,
      guests: contactLabels.guests,
      location: contactLabels.location,
      budget: contactLabels.budget,
      plusOne: this.plusOneLabel(),
      dietary: this.dietaryLabel(),
      message: contactLabels.message
    };

    this.inquiryConfirmation.set('Submitting your inquiry...');
    try {
      await this.contactService.submitInquiry(
        inquiry,
        labels,
        'whatsapp',
        this.contactEmail(),
        this.contactWhatsAppNumber()
      );
      this.inquiryConfirmation.set('Your details were sent successfully. Thank you.');
      this.trackEvent('rsvp_complete', { channel: 'whatsapp' });
    } catch (error) {
      this.inquiryConfirmation.set(
        error instanceof Error ? error.message : 'Failed to submit inquiry.'
      );
    }
  }

  private finishAdminLogin(accessToken: string): void {
    this.adminAccessToken = accessToken;
    this.isAdminAuthenticated.set(true);
    this.isAdminEditing.set(true);
    this.isAdminModalOpen.set(false);
    this.isMfaStep.set(false);
    this.adminAuthMessage.set('Admin edit mode enabled.');
    this.document.defaultView?.sessionStorage.setItem('landing_admin_access_token', accessToken);
    void this.loadAdminManagerData();
  }

  private async loadAdminManagerData(): Promise<void> {
    await Promise.all([this.loadAdminProfile(), this.loadAdminUsers()]);
  }

  private async loadAdminProfile(): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${this.adminAccessToken}` }
      });
      const payload = (await response.json()) as { user?: AdminUser };
      if (response.ok && payload.user) {
        this.adminProfile.set(payload.user);
      }
    } catch {
      // Keep existing profile state.
    }
  }

  private async loadAdminUsers(): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/users`, {
        headers: { Authorization: `Bearer ${this.adminAccessToken}` }
      });
      const payload = (await response.json()) as { users?: AdminUser[] };
      if (response.ok && Array.isArray(payload.users)) {
        this.adminUsers.set(payload.users);
      }
    } catch {
      // Keep existing users state.
    }
  }

  private setContentPath(path: string, value: unknown): void {
    const language = this.currentLanguage();
    const remote = structuredClone(this.remoteContent() ?? {});
    const languageContent = (remote[language] ?? {}) as Record<string, unknown>;
    this.setByPath(languageContent, path, value);
    remote[language] = languageContent as ContentSection;
    this.remoteContent.set(remote);
  }

  private setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let cursor: unknown = target;

    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      const keyIndex = this.indexFromKey(key);
      const nextIsIndex = this.indexFromKey(nextKey) !== null;

      if (Array.isArray(cursor)) {
        if (keyIndex === null) {
          return;
        }
        const current = cursor[keyIndex];
        if (!current || typeof current !== 'object') {
          cursor[keyIndex] = nextIsIndex ? [] : {};
        }
        cursor = cursor[keyIndex];
        continue;
      }

      if (!cursor || typeof cursor !== 'object') {
        return;
      }

      const objectCursor = cursor as Record<string, unknown>;
      const current = objectCursor[key];
      if (!current || typeof current !== 'object') {
        objectCursor[key] = nextIsIndex ? [] : {};
      }
      cursor = objectCursor[key];
    }

    const lastKey = keys[keys.length - 1];
    const lastIndex = this.indexFromKey(lastKey);
    if (Array.isArray(cursor) && lastIndex !== null) {
      cursor[lastIndex] = value;
      return;
    }

    if (cursor && typeof cursor === 'object') {
      (cursor as Record<string, unknown>)[lastKey] = value;
    }
  }

  private indexFromKey(key: string): number | null {
    if (!/^\d+$/.test(key)) {
      return null;
    }
    return Number(key);
  }

  private resolvedContent(language: Language): ContentSection {
    const base = structuredClone(CONTENT[language]) as Record<string, unknown>;
    const remote = (this.remoteContent()?.[language] ?? {}) as Record<string, unknown>;
    return this.deepMerge(base, remote) as ContentSection;
  }

  private deepMerge(
    base: Record<string, unknown>,
    override: Record<string, unknown>
  ): Record<string, unknown> {
    const result = structuredClone(base);
    for (const [key, value] of Object.entries(override)) {
      if (Array.isArray(value)) {
        result[key] = structuredClone(value);
        continue;
      }

      if (value && typeof value === 'object') {
        const current = result[key];
        const merged = this.deepMerge(
          current && typeof current === 'object' && !Array.isArray(current)
            ? (current as Record<string, unknown>)
            : {},
          value as Record<string, unknown>
        );
        result[key] = merged;
        continue;
      }

      result[key] = value;
    }
    return result;
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

  private contactWhatsAppNumber(): string {
    return this.content().contact.channels?.whatsappNumber ?? this.defaultWhatsAppNumber;
  }

  private shouldOpenWizardFromCta(placement: string): boolean {
    const openWizardPlacements = new Set([
      'header',
      'hero-primary',
      'about',
      'footer',
      'sticky-rsvp'
    ]);
    return openWizardPlacements.has(placement);
  }
}

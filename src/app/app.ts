import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import {
  EVENT_ESSENTIALS,
  EVENT_TIMELINE,
  GALLERY_PHOTOS,
  MAP_LINK,
  PLUS_ONE_OPTIONS,
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
import { InquirySubmission } from './models/contact.model';
import { ContentSection, Language, NavItem } from './models/site-content.model';
import { AnalyticsService } from './services/analytics.service';
import { ContactService } from './services/contact.service';

type AdminUser = {
  id: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: string;
};

type ToastLevel = 'success' | 'error' | 'info';

type ToastMessage = {
  id: number;
  level: ToastLevel;
  title: string;
  message: string;
};

type LegalTab = 'terms' | 'privacy' | 'cookies';
type CookieConsent = 'unknown' | 'accepted' | 'rejected';

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
  private readonly adminApiBase = '';
  private readonly defaultContactEmail = 'Eliteweddingsandeventsco1@gmail.com';
  private readonly defaultContactWhatsApp = '+995 595 930 899';
  private readonly defaultWhatsAppNumber = '995595930899';

  protected readonly currentLanguage = signal<Language>('en');
  private readonly remoteContent = signal<Partial<Record<Language, ContentSection>> | null>(null);
  protected readonly content = computed(() => this.resolvedContent(this.currentLanguage()));
  protected readonly inquiryConfirmation = signal('');
  protected readonly cookieConsent = signal<CookieConsent>('unknown');
  protected readonly isAdminModalOpen = signal(false);
  protected readonly isAdminAuthenticated = signal(false);
  protected readonly isAdminEditing = signal(false);
  protected readonly isLegalModalOpen = signal(false);
  protected readonly legalTab = signal<LegalTab>('terms');
  protected readonly adminAuthMessage = signal('');
  protected readonly isMfaStep = signal(false);
  protected readonly isAdminManagerOpen = signal(false);
  protected readonly adminManagerTab = signal<'profile' | 'users' | 'content'>('profile');
  protected readonly adminProfile = signal<AdminUser | null>(null);
  protected readonly adminUsers = signal<AdminUser[]>([]);
  protected readonly adminManagerMessage = signal('');
  protected readonly adminUsersFilter = signal('');
  protected readonly adminContentDraftLanguage = signal<Language>('en');
  protected readonly adminContentDraft = signal('');
  protected readonly hasUnsavedAdminChanges = signal(false);
  protected readonly mfaSetup = signal<{ otpauthUrl: string; expiresInSec: number } | null>(null);
  protected readonly activeInlineEditor = signal<
    'hero' | 'essentials' | 'about' | 'gallery' | 'faq' | 'contact' | 'footer' | null
  >(null);
  private adminTempToken = '';
  private adminAccessToken = '';
  private readonly cookieConsentStorageKey = 'landing_cookie_consent';
  private toastIdCounter = 0;
  private readonly toastTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  public readonly toasts = signal<ToastMessage[]>([]);

  public constructor() {
    effect(() => {
      const language = this.currentLanguage();
      this.document.body.classList.toggle('lang-ka', language === 'ka');
      this.document.body.classList.toggle('lang-en', language === 'en');
      this.document.documentElement.lang = language;
    });

    void this.loadRemoteContent();
    this.initRevealMotion();
    this.initCookieConsent();

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
    const endpoints = ['/api/public/content'];

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

    if (this.isLegalModalOpen()) {
      this.closeLegalModal();
    }
  };

  public ngOnDestroy(): void {
    this.document.defaultView?.removeEventListener('keydown', this.onAdminShortcut);
    this.document.defaultView?.removeEventListener('keydown', this.onEscapeClose);
    for (const timeout of this.toastTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.toastTimeouts.clear();
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

  protected acceptCookies(): void {
    this.setCookieConsent('accepted');
  }

  protected rejectCookies(): void {
    this.setCookieConsent('rejected');
  }

  protected openLegalModal(tab: LegalTab): void {
    this.legalTab.set(tab);
    this.isLegalModalOpen.set(true);
  }

  protected closeLegalModal(): void {
    this.isLegalModalOpen.set(false);
  }

  protected legalLabel(tab: LegalTab): string {
    const ka = this.currentLanguage() === 'ka';
    if (tab === 'terms') {
      return ka ? 'wesebi da pirobebi' : 'Terms & Conditions';
    }
    if (tab === 'privacy') {
      return ka ? 'konfidentsialurobis politika' : 'Privacy Policy';
    }
    return ka ? 'quqi politika' : 'Cookie Policy';
  }

  protected legalModalTitle(): string {
    return this.legalLabel(this.legalTab());
  }

  protected legalUpdatedAt(): string {
    return this.currentLanguage() === 'ka' ? 'ganaxlda: 2026-03-30' : 'Last updated: 2026-03-30';
  }

  protected legalSections(): Array<{ title: string; points: string[] }> {
    const ka = this.currentLanguage() === 'ka';
    const tab = this.legalTab();

    if (tab === 'terms') {
      if (ka) {
        return [
          {
            title: '1. momsaxurebis motsuloba',
            points: [
              'Elite Weddings & Events Co. gtavazobt qorwilis dagegmvas, koordinatsias da sakonsultatsio momsaxurebas.',
              'saboloo momsaxurebis sia, vadebi da pasuxismgeblobebi ganisazghvreba xelshekrulebit an werilobiti shetavazebit.'
            ]
          },
          {
            title: '2. dajavshna da gadaxdebi',
            points: [
              'dajavshna dzalashi shedis mxolod xelshekrulebis/dadasturebis da winaswari gadaxdis shemdeg.',
              'dagvianebulma gadaxdam sheidzleba gamoiwvios servisis shechereba an dajavshnili tarighis dakargva.'
            ]
          },
          {
            title: '3. gauqmeba, gadatana da dabruneba',
            points: [
              'gauqmebis da tanxis dabrunebis pirobebi ganisazghvreba individualuri xelshekrulebis mixedvit.',
              'tarighis tsvlileba damokidebulia vendorebisa da lokatsiis xelmisawvdomobaze da sheidzleba moitsavdes damatebit xarjebs.'
            ]
          },
          {
            title: '4. mesame mxaris vendorebi',
            points: [
              'fotografi, videografi, qeiteringi, transporti, musika da sxva momwodeblebi sheidzleba iyvnen damoukidebeli kontraqtorebi.',
              'kompania pasuxismgebelia koordinatsiaze, magram ara mesame mxaris damoukidebel darghvevebze.'
            ]
          },
          {
            title: '5. pasuxismgeblobis shezghudva',
            points: [
              'fors-mazhoris shemtxvevebshi (amindi, stiqia, saxelmwifo shezghudvebi da sxva) valdebulebebi sruldeba shesabamisi kanonisa da xelshekrulebis mixedvit.',
              'pasuxismgeblobis limiti, tu sxva ram ar aris motxovnili kanonit, shemoifargleba realurad gadaxdili momsaxurebis tanxit.'
            ]
          },
          {
            title: '6. inteleqtualuri sakutreba da samartali',
            points: [
              'saitis teqstebi, fotoebi da brenduli elementebi datsulia da mati unebartvo gamoyeneba akrdzalulia.',
              'davebis shemtxvevashi, tu xelshekrulebit sxva ram ar aris gatvaliswinebuli, gamoiyeneba saqartvelos kanonmdebloba.'
            ]
          }
        ];
      }

      return [
        {
          title: '1. Service Scope',
          points: [
            'Elite Weddings & Events Co. provides wedding planning, coordination, and consulting services.',
            'Final scope, deliverables, timelines, and responsibilities are defined in your written agreement.'
          ]
        },
        {
          title: '2. Booking and Payments',
          points: [
            'A booking becomes effective only after written confirmation and the agreed deposit payment.',
            'Late payments may pause services or release reserved dates/vendor slots.'
          ]
        },
        {
          title: '3. Cancellation, Rescheduling, Refunds',
          points: [
            'Cancellation and refund terms are governed by the signed contract and payment stage.',
            'Date changes are subject to vendor/venue availability and may involve additional costs.'
          ]
        },
        {
          title: '4. Third-Party Vendors',
          points: [
            'Photographers, venues, caterers, transport, and other providers may be independent contractors.',
            'We are responsible for coordination services, not for independent third-party non-performance.'
          ]
        },
        {
          title: '5. Limitation of Liability',
          points: [
            'Force majeure events (weather, natural events, public restrictions, etc.) are handled under applicable law and contract terms.',
            'Unless otherwise required by law, liability is limited to fees actually paid for our services.'
          ]
        },
        {
          title: '6. Intellectual Property and Governing Law',
          points: [
            'Website content and brand assets may not be reused without prior written permission.',
            'Unless otherwise agreed in writing, disputes are governed by Georgian law.'
          ]
        }
      ];
    }

    if (tab === 'privacy') {
      if (ka) {
        return [
          {
            title: '1. ra monatsemebs vagrovebt',
            points: [
              'sakontaqto formis monatsemebi: saxeli, elfosta, telefoni, ghonisdziebis detalebi.',
              'teqnikuri/usafrtxoebis monatsemebi: IP misamarti, anti-spamis signalebi, motxovnis logebi.'
            ]
          },
          {
            title: '2. damushavebis mizani',
            points: [
              'tqvens motxovnaze pasuxistvis, shetavazebis mosamzadeblad da momsaxurebis gasawevad.',
              'personaluri monatsemebi ar iyideba da ar qiravdeba mesame pirebze.'
            ]
          },
          {
            title: '3. mesame pirebtan gaziareba',
            points: [
              'monatsemebi sheidzleba gaziardes mxolod sachiro teqnikur servis-provaiderebtan (mag.: hostingi, elfostis miwodeba).',
              'am partniorebs evalebat konfidentsialurobisa da usafrtxoebis datsva.'
            ]
          },
          {
            title: '4. shenaxvis vadebi da usafrtxoeba',
            points: [
              'monatsemebi inaxeba imden xans, ramdenits sachiroa momsaxurebistvis da samartlebrivi valdebulebebis shesasruleblad.',
              'viyenebt gonivrul teqnikur da organizatsiul zomebs monatsemta dasatsavad.'
            ]
          },
          {
            title: '5. tqveni uflebebi',
            points: [
              'kanonis farglebshi shegidzliat moitxovot monatsemebze wvdoma, shesworeba, washla an shezghudva.',
              `mimartet: ${this.contactEmail()}.`
            ]
          },
          {
            title: '6. saertashoriso gadatsema da arasrulwlovnebi',
            points: [
              'tu monatsemebi mushavdeba utsxo qveyanashi myofi provaideris mier, gamoiyeneba shesabamisi datsvis zomebi.',
              'servisi ar aris gankutvnili arasrulwlovnebis mier damoukidebeli xelshekrulebistvis.'
            ]
          }
        ];
      }

      return [
        {
          title: '1. Data We Collect',
          points: [
            'Contact details you submit: name, email, phone, and event preferences.',
            'Technical/security data: IP address, anti-abuse signals, and request logs.'
          ]
        },
        {
          title: '2. Why We Process Data',
          points: [
            'To respond to inquiries, prepare proposals, and deliver planning services.',
            'We do not sell or rent personal data to third parties.'
          ]
        },
        {
          title: '3. Sharing with Service Providers',
          points: [
            'Data may be shared only with necessary providers (e.g., hosting, email delivery) for service operation.',
            'Such providers are expected to apply confidentiality and security safeguards.'
          ]
        },
        {
          title: '4. Retention and Security',
          points: [
            'Data is retained only as long as needed for service and legal/accounting obligations.',
            'We apply reasonable technical and organizational safeguards to protect personal data.'
          ]
        },
        {
          title: '5. Your Rights',
          points: [
            'Where applicable by law, you may request access, correction, deletion, or restriction of processing.',
            `For privacy requests, contact: ${this.contactEmail()}.`
          ]
        },
        {
          title: '6. International Transfers and Minors',
          points: [
            'If providers process data outside your country, appropriate safeguards are applied.',
            'This service is not intended for independent contracting by minors.'
          ]
        }
      ];
    }

    if (ka) {
      return [
        {
          title: '1. ra aris quqi',
          points: [
            'quqi aris mtsire faili, romelits inaxeba tqvens brauzershi da exmareba saitis mushaobas.',
            'quqebi sheidzleba iyos autsilebeli funqtsionirebistvis an analitikistvis.'
          ]
        },
        {
          title: '2. quqebis tipebi',
          points: [
            'autsilebeli quqebi: usafrtxoeba, sesia, formebis dziritadi funqtsionireba.',
            'analitikuri quqebi: agregirebuli statistika (mxolod tanxmobis shemtxvevashi).'
          ]
        },
        {
          title: '3. tanxmoba da martva',
          points: [
            'saitze pirvel vizitze shegidzliat daadasturot an uaryot arasavaldebulo quqebi.',
            'quqebis kontroli/washla aseve shesadzlebelia brauzeris parametrebidan.'
          ]
        },
        {
          title: '4. vadebi',
          points: [
            'sesiuri quqebi ishleba brauzeris daxurvisas.',
            'mudmivi quqebi inaxeba konkretuli vadit an xelit washlamde.'
          ]
        }
      ];
    }

    return [
      {
        title: '1. What Cookies Are',
        points: [
          'Cookies are small text files stored by your browser to help website functionality.',
          'Cookies may be essential for operation or optional for analytics.'
        ]
      },
      {
        title: '2. Cookie Types',
        points: [
          'Essential cookies: security, session continuity, and core form behavior.',
          'Analytics cookies: aggregate usage insights (only with your consent).'
        ]
      },
      {
        title: '3. Consent and Control',
        points: [
          'On first visit, you can accept or reject optional analytics cookies.',
          'You can also manage or delete cookies from browser settings anytime.'
        ]
      },
      {
        title: '4. Duration',
        points: [
          'Session cookies expire when the browser closes.',
          'Persistent cookies remain until expiry or manual deletion.'
        ]
      }
    ];
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
        this.showToast('info', 'MFA Required', 'Enter the authenticator code to continue.');
        return;
      }

      if (!payload.accessToken) {
        throw new Error('Missing access token.');
      }

      this.finishAdminLogin(payload.accessToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      this.adminAuthMessage.set(message);
      this.showToast('error', 'Admin Login Failed', message);
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
      const message = error instanceof Error ? error.message : 'MFA verification failed.';
      this.adminAuthMessage.set(message);
      this.showToast('error', 'MFA Verification Failed', message);
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
      this.showToast('success', 'Changes Saved', 'Website content updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      this.adminAuthMessage.set(message);
      this.showToast('error', 'Save Failed', message);
    }
  }

  protected openAdminManager(tab: 'profile' | 'users' | 'content'): void {
    this.adminManagerTab.set(tab);
    this.isAdminManagerOpen.set(true);
    this.adminManagerMessage.set('');
    if (tab === 'content') {
      this.adminContentDraftLanguage.set(this.currentLanguage());
      this.refreshAdminContentDraft();
    }
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
      this.showToast('success', 'Profile Saved', 'Your admin profile has been updated.');
      await this.loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile save failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'Profile Save Failed', message);
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
        expiresInSec?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'MFA setup failed.');
      }

      this.mfaSetup.set({
        otpauthUrl: payload.otpauthUrl ?? '',
        expiresInSec: Number(payload.expiresInSec || 0)
      });
      this.adminManagerMessage.set('Scan the QR and enter your 6-digit code to activate authenticator.');
      this.showToast('info', 'Scan QR Code', 'Enter a code from your authenticator app to finish activation.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA setup failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'MFA Setup Failed', message);
    }
  }

  protected async confirmAdminMfaSetup(code: string): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    this.adminManagerMessage.set('Confirming authenticator code...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/auth/mfa/setup/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        },
        body: JSON.stringify({ code })
      });

      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || 'MFA confirmation failed.');
      }

      this.adminProfile.set(payload.user);
      this.mfaSetup.set(null);
      this.adminManagerMessage.set('Authenticator enabled.');
      this.showToast('success', 'Authenticator Enabled', 'MFA is now active for your account.');
      await this.loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA confirmation failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'MFA Confirmation Failed', message);
    }
  }

  protected async disableAdminMfa(): Promise<void> {
    if (!this.adminAccessToken) {
      return;
    }

    this.adminManagerMessage.set('Disabling authenticator...');
    try {
      const response = await fetch(`${this.adminApiBase}/api/admin/auth/mfa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.adminAccessToken}`
        }
      });
      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || 'MFA disable failed.');
      }

      this.adminProfile.set(payload.user);
      this.mfaSetup.set(null);
      this.adminManagerMessage.set('Authenticator disabled.');
      this.showToast('success', 'Authenticator Disabled', 'MFA has been turned off.');
      await this.loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MFA disable failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'MFA Disable Failed', message);
    }
  }

  protected mfaQrCodeUrl(): string {
    const otpUrl = this.mfaSetup()?.otpauthUrl || '';
    if (!otpUrl) {
      return '';
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpUrl)}`;
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
      this.showToast('success', 'User Created', `${payload.user.email} was added.`);
      await this.loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User create failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'User Create Failed', message);
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
      this.showToast('success', 'User Updated', `${payload.user.email} was updated.`);
      await this.loadAdminUsers();
      await this.loadAdminProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User update failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'User Update Failed', message);
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
      this.showToast('success', 'User Deleted', 'The selected user account has been removed.');
      await this.loadAdminUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User delete failed.';
      this.adminManagerMessage.set(message);
      this.showToast('error', 'User Delete Failed', message);
    }
  }

  protected refreshAdminUsers(): void {
    void this.loadAdminUsers();
  }

  protected setAdminContentDraftLanguage(language: Language): void {
    this.adminContentDraftLanguage.set(language);
    this.refreshAdminContentDraft();
  }

  protected refreshAdminContentDraft(): void {
    const language = this.adminContentDraftLanguage();
    const content = this.resolvedContent(language);
    this.adminContentDraft.set(JSON.stringify(content, null, 2));
  }

  protected formatAdminContentDraft(): void {
    try {
      const parsed = JSON.parse(this.adminContentDraft()) as unknown;
      this.adminContentDraft.set(JSON.stringify(parsed, null, 2));
      this.adminManagerMessage.set('Content JSON formatted.');
    } catch {
      this.adminManagerMessage.set('Content JSON is invalid.');
    }
  }

  protected applyAdminContentDraft(): void {
    const language = this.adminContentDraftLanguage();
    try {
      const parsed = JSON.parse(this.adminContentDraft()) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.adminManagerMessage.set('Content JSON must be an object.');
        return;
      }

      const remote = structuredClone(this.remoteContent() ?? {});
      remote[language] = parsed as ContentSection;
      this.remoteContent.set(remote);
      this.hasUnsavedAdminChanges.set(true);
      this.adminManagerMessage.set(
        `Applied ${language.toUpperCase()} content to preview. Click "Save changes" to persist.`
      );
      this.showToast(
        'info',
        'Preview Updated',
        `${language.toUpperCase()} content draft applied locally.`
      );
    } catch {
      this.adminManagerMessage.set('Content JSON is invalid.');
      this.showToast('error', 'Invalid JSON', 'Fix JSON errors before applying content draft.');
    }
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
      this.showToast('success', 'Copied', successMessage);
    } catch {
      this.adminManagerMessage.set('Copy failed. Please copy manually.');
      this.showToast('error', 'Copy Failed', 'Please copy the value manually.');
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
    return this.content().navItems;
  }

  protected eventEssentialsTitle(): string {
    return this.resolveLandingText(
      this.content().landing?.eventEssentialsTitle,
      'mtavari detalebi',
      'Event essentials'
    );
  }

  protected eventEssentialsDescription(): string {
    return this.resolveLandingText(
      this.content().landing?.eventEssentialsDescription,
      'stumrebistvis sachiro yvelaferi ert ekranze: tarighi, dro, lokatsia, dres kodi da taimlaini.',
      'Everything guests need at a glance: date, time, location, dress code, and timeline.'
    );
  }

  protected eventEssentials(): { label: string; value: string }[] {
    const editableEssentials = this.content().landing?.eventEssentials;
    if (editableEssentials?.length) {
      const safeEssentials = editableEssentials.filter(
        (item): item is { label: string; value: string } => this.isEssentialItem(item)
      );
      if (
        safeEssentials.length === editableEssentials.length
        && !safeEssentials.some((item) => this.isMojibakeString(item.label) || this.isMojibakeString(item.value))
      ) {
        return safeEssentials;
      }
    }

    if (this.currentLanguage() === 'ka') {
      return [
        { label: 'tarighi', value: '12 seqtemberi, 2026' },
        { label: 'dro', value: '17:00 tseremonia, 19:00 migheba' },
        { label: 'lokatsia', value: 'Wedding Palace, tbilisi' },
        { label: 'dres kodi', value: 'Formal / Black tie optional' }
      ];
    }

    return EVENT_ESSENTIALS;
  }

  protected eventTimelineTitle(): string {
    return this.resolveLandingText(
      this.content().landing?.eventTimelineTitle,
      'dghis taimlaini',
      'Wedding day timeline'
    );
  }

  protected eventTimeline(): string[] {
    const editableTimeline = this.content().landing?.eventTimeline;
    if (editableTimeline?.length) {
      const safeTimeline = editableTimeline.filter((item): item is string => typeof item === 'string');
      if (
        safeTimeline.length === editableTimeline.length
        && !safeTimeline.some((item) => this.isMojibakeString(item))
      ) {
        return safeTimeline;
      }
    }

    if (this.currentLanguage() === 'ka') {
      return [
        '17:00 - stumrebis migheba',
        '17:30 - tseremonia',
        '19:00 - vaxshami',
        '21:00 - wveuleba'
      ];
    }

    return EVENT_TIMELINE;
  }

  protected galleryPhotos(): { src: string; alt: string }[] {
    const editablePhotos = this.content().landing?.galleryPhotos;
    return editablePhotos?.length ? editablePhotos : GALLERY_PHOTOS;
  }

  protected plusOneLabel(): string {
    return this.resolveLandingText(this.content().landing?.plusOneLabel, 'plus erti', 'Plus one');
  }

  protected quickContactLabel(): string {
    return this.resolveLandingText(this.content().landing?.quickContactLabel, 'swrafi kontaqti', 'Quick contact');
  }

  protected dietaryLabel(): string {
    return this.resolveLandingText(this.content().landing?.dietaryLabel, 'kvebiti shezghudvebi', 'Dietary preferences');
  }

  protected plusOneOptions(): SelectOption[] {
    const editableOptions = this.content().landing?.plusOneOptions;
    if (editableOptions?.length) {
      const safeOptions = editableOptions.filter(
        (option): option is SelectOption => this.isSelectOptionItem(option)
      );
      if (
        safeOptions.length === editableOptions.length
        && !safeOptions.some((option) => this.isMojibakeString(option.label))
      ) {
        return safeOptions;
      }
    }

    if (this.currentLanguage() === 'ka') {
      return [
        { value: '', label: 'airchiet' },
        { value: 'Yes', label: 'ki' },
        { value: 'No', label: 'ara' },
        { value: 'Maybe', label: 'shesadzloa' }
      ];
    }

    return PLUS_ONE_OPTIONS;
  }

  protected rsvpNowLabel(): string {
    return this.resolveLandingText(this.content().landing?.rsvpNowLabel, 'RSVP axlave', 'RSVP now');
  }

  protected viewDetailsLabel(): string {
    return this.resolveLandingText(this.content().landing?.viewDetailsLabel, 'detalebis naxva', 'View details');
  }

  protected eventInfoEyebrow(): string {
    return this.resolveLandingText(this.content().landing?.eventInfoEyebrow, 'ghonisdziebis informatsia', 'Event info');
  }

  protected openMapLabel(): string {
    return this.resolveLandingText(this.content().landing?.openMapLabel, 'lokatsiis rukis gaxsna', 'Open venue map');
  }

  protected galleryEyebrow(): string {
    return this.resolveLandingText(this.content().landing?.galleryEyebrow, 'galerea', 'Gallery');
  }

  protected galleryTitle(): string {
    return this.resolveLandingText(
      this.content().landing?.galleryTitle,
      'momentebi realuri ghonisdziebebidan',
      'Moments from real celebrations'
    );
  }

  protected contactEyebrow(): string {
    return this.resolveLandingText(this.content().landing?.contactEyebrow, 'kontaqti da RSVP', 'Contact & RSVP');
  }

  protected contactTitle(): string {
    return this.resolveLandingText(this.content().landing?.contactTitle, 'RSVP 30 wamshi', 'RSVP in 30 seconds');
  }

  protected contactDescription(): string {
    return this.resolveLandingText(
      this.content().landing?.contactDescription,
      'mokle forma, myisieri gagzavna elfostit an WhatsApp-it.',
      'Short form, instant send via email or WhatsApp.'
    );
  }

  protected sendByEmailLabel(): string {
    return this.resolveLandingText(
      this.content().landing?.sendByEmailLabel,
      'RSVP gagzavna elfostaze',
      'Send RSVP by email'
    );
  }

  protected sendByWhatsappLabel(): string {
    return this.resolveLandingText(
      this.content().landing?.sendByWhatsappLabel,
      'RSVP gagzavna WhatsApp-ze',
      'Send RSVP by WhatsApp'
    );
  }

  protected responseTimeLabel(): string {
    return this.resolveLandingText(
      this.content().landing?.responseTimeLabel,
      'pasuxis dro: 24 saatshi',
      'Response time: within 24 hours'
    );
  }

  protected openWhatsappLabel(): string {
    return this.resolveLandingText(this.content().landing?.openWhatsappLabel, 'WhatsApp gaxsna', 'Open WhatsApp');
  }

  protected footerTitle(): string {
    return this.resolveLandingText(
      this.content().landing?.footerTitle,
      'mzad xart aghsanishnavad chventan ertad?',
      'Ready to celebrate with us?'
    );
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

  protected async sendInquiryByEmail(submission: InquirySubmission): Promise<void> {
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
        submission,
        labels,
        'email',
        this.contactEmail(),
        this.contactWhatsAppNumber()
      );
      this.inquiryConfirmation.set('Your details were sent successfully. Thank you.');
      this.trackEvent('rsvp_complete', { channel: 'email' });
      this.showToast('success', 'Inquiry Sent', 'Your email inquiry was sent successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit inquiry.';
      this.inquiryConfirmation.set(message);
      this.showToast('error', 'Inquiry Failed', message);
    }
  }

  protected async sendInquiryByWhatsApp(submission: InquirySubmission): Promise<void> {
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
        submission,
        labels,
        'whatsapp',
        this.contactEmail(),
        this.contactWhatsAppNumber()
      );
      this.inquiryConfirmation.set('Your details were sent successfully. Thank you.');
      this.trackEvent('rsvp_complete', { channel: 'whatsapp' });
      this.showToast('success', 'Inquiry Sent', 'Your WhatsApp inquiry was sent successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit inquiry.';
      this.inquiryConfirmation.set(message);
      this.showToast('error', 'Inquiry Failed', message);
    }
  }

  private finishAdminLogin(accessToken: string): void {
    this.adminAccessToken = accessToken;
    this.isAdminAuthenticated.set(true);
    this.isAdminEditing.set(true);
    this.isAdminModalOpen.set(false);
    this.isMfaStep.set(false);
    this.adminAuthMessage.set('Admin edit mode enabled.');
    this.showToast('success', 'Admin Mode Enabled', 'You are now in edit mode.');
    this.document.defaultView?.sessionStorage.setItem('landing_admin_access_token', accessToken);
    void this.loadAdminManagerData();
  }

  public dismissToast(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
    const timeout = this.toastTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(id);
    }
  }

  private showToast(level: ToastLevel, title: string, message: string, durationMs = 4200): void {
    const id = ++this.toastIdCounter;
    this.toasts.update((current) => [...current, { id, level, title, message }]);
    const timeout = setTimeout(() => this.dismissToast(id), durationMs);
    this.toastTimeouts.set(id, timeout);
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
    const merged = this.deepMerge(base, remote);
    return this.normalizeContentText(merged) as ContentSection;
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

  private hasMojibakeMarker(value: string): boolean {
    return /(?:\u00e1\u0192|\u00c3|\u00c2|\u00e2\u20ac|\ufffd)/u.test(value);
  }

  private maybeRepairMojibake(value: string): string {
    if (!this.hasMojibakeMarker(value)) {
      return value;
    }

    let decoded = value;
    try {
      decoded = decodeURIComponent(
        value
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );
    } catch {
      return value;
    }

    const decodedLooksGeorgian = /[\u10a0-\u10ff]/u.test(decoded);
    const decodedStillBroken = this.hasMojibakeMarker(decoded);
    if (decodedLooksGeorgian && !decodedStillBroken) {
      return decoded;
    }

    return value;
  }

  private normalizeContentText(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.maybeRepairMojibake(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeContentText(item));
    }

    if (value && typeof value === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        cleaned[key] = this.normalizeContentText(child);
      }
      return cleaned;
    }

    return value;
  }

  private isEssentialItem(value: unknown): value is { label: string; value: string } {
    return Boolean(
      value
      && typeof value === 'object'
      && typeof (value as { label?: unknown }).label === 'string'
      && typeof (value as { value?: unknown }).value === 'string'
    );
  }

  private isSelectOptionItem(value: unknown): value is SelectOption {
    return Boolean(
      value
      && typeof value === 'object'
      && typeof (value as { value?: unknown }).value === 'string'
      && typeof (value as { label?: unknown }).label === 'string'
    );
  }

  private isMojibakeString(value: string): boolean {
    return /�|ï¿½|áƒ|â€|Ã|Â/.test(value);
  }

  private resolveLandingText(
    value: string | undefined,
    kaFallback: string,
    enFallback: string
  ): string {
    if (typeof value === 'string' && value.trim() && !this.isMojibakeString(value)) {
      return value;
    }
    return this.currentLanguage() === 'ka' ? kaFallback : enFallback;
  }

  private trackEvent(
    eventName: string,
    params: Record<string, string | number | boolean>
  ): void {
    if (this.cookieConsent() !== 'accepted') {
      return;
    }
    this.analyticsService.track(this.document.defaultView, eventName, params);
  }

  private initCookieConsent(): void {
    const stored = this.document.defaultView?.localStorage.getItem(this.cookieConsentStorageKey);
    if (stored === 'accepted' || stored === 'rejected') {
      this.cookieConsent.set(stored);
      return;
    }
    this.cookieConsent.set('unknown');
  }

  private setCookieConsent(consent: Exclude<CookieConsent, 'unknown'>): void {
    this.cookieConsent.set(consent);
    this.document.defaultView?.localStorage.setItem(this.cookieConsentStorageKey, consent);
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



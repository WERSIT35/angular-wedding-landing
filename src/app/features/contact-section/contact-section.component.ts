import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input, output, signal } from '@angular/core';
import { SelectOption } from '../../data/event.data';
import { ContactInquiry } from '../../models/contact.model';
import { ContentSection } from '../../models/site-content.model';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  templateUrl: './contact-section.component.html',
  styleUrls: ['./contact-section.component.scss']
})
export class ContactSectionComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly onOpenWizardRequest = (): void => {
    if (!this.isInlineEditing()) {
      this.openWizard();
    }
  };

  protected readonly draft = signal<ContactInquiry>({
    name: '',
    email: '',
    phone: '',
    weddingType: '',
    date: '',
    guests: '',
    location: '',
    budget: '',
    plusOne: '',
    dietary: '',
    message: ''
  });
  protected readonly formError = signal('');
  protected readonly wizardOpen = signal(false);
  protected readonly wizardFinished = signal(false);
  protected readonly currentStepIndex = signal(0);
  protected readonly stepOrder: Array<keyof ContactInquiry> = [
    'name',
    'email',
    'phone',
    'weddingType',
    'date',
    'guests',
    'location',
    'budget',
    'plusOne',
    'dietary',
    'message'
  ];
  protected readonly weddingTypeOptions = [
    'Civil wedding',
    'Church wedding',
    'Beach wedding',
    'Vineyard wedding',
    'Mountain wedding',
    'Luxury hotel wedding',
    'Elopement',
    'Other'
  ];
  protected readonly locationOptions = ['Tbilisi', 'Kakheti', 'Kazbegi', 'Batumi', 'Other'];
  protected readonly budgetOptions = ['Under $5,000', '$5,000 - $10,000', '$10,000 - $20,000', '$20,000+'];
  protected readonly guestOptions = ['10-30', '30-60', '60-100', '100+'];

  public readonly contact = input.required<ContentSection['contact']>();
  public readonly contactEyebrow = input.required<string>();
  public readonly contactTitle = input.required<string>();
  public readonly contactDescription = input.required<string>();
  public readonly plusOneLabel = input.required<string>();
  public readonly plusOneOptions = input.required<SelectOption[]>();
  public readonly dietaryLabel = input.required<string>();
  public readonly sendByEmailLabel = input.required<string>();
  public readonly sendByWhatsappLabel = input.required<string>();
  public readonly quickContactLabel = input.required<string>();
  public readonly responseTimeLabel = input.required<string>();
  public readonly openWhatsappLabel = input.required<string>();
  public readonly whatsAppDirectLink = input.required<string>();
  public readonly contactEmail = input.required<string>();
  public readonly contactWhatsApp = input.required<string>();
  public readonly inquiryConfirmation = input.required<string>();
  public readonly isInlineEditing = input<boolean>(false);

  public readonly emailSubmit = output<ContactInquiry>();
  public readonly whatsappSubmit = output<ContactInquiry>();
  public readonly formInteraction = output<void>();
  public readonly ctaClick = output<string>();
  public readonly inlineEdit = output<{ path: string; value: string }>();

  public ngAfterViewInit(): void {
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (!view) {
      return;
    }
    view.addEventListener('open-wedding-wizard', this.onOpenWizardRequest as EventListener);
  }

  public ngOnDestroy(): void {
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (!view) {
      return;
    }
    view.removeEventListener('open-wedding-wizard', this.onOpenWizardRequest as EventListener);
  }

  protected onFormInteraction(): void {
    this.formInteraction.emit();
  }

  protected openWizard(): void {
    this.wizardOpen.set(true);
    this.wizardFinished.set(false);
    this.currentStepIndex.set(0);
    this.formError.set('');
  }

  protected closeWizard(): void {
    this.wizardOpen.set(false);
    this.formError.set('');
  }

  protected currentStepField(): keyof ContactInquiry {
    return this.stepOrder[this.currentStepIndex()];
  }

  protected progressPercent(): number {
    return Math.round(((this.currentStepIndex() + 1) / this.stepOrder.length) * 100);
  }

  protected canGoBack(): boolean {
    return this.currentStepIndex() > 0;
  }

  protected previousStep(): void {
    const next = Math.max(0, this.currentStepIndex() - 1);
    this.currentStepIndex.set(next);
    this.formError.set('');
  }

  protected nextStep(): void {
    const field = this.currentStepField();
    const value = this.draft()[field].trim();
    if (!this.isFieldSatisfied(field, value)) {
      this.formError.set(this.stepErrorMessage(field));
      return;
    }

    this.formError.set('');
    if (this.currentStepIndex() >= this.stepOrder.length - 1) {
      this.wizardFinished.set(true);
      return;
    }

    this.currentStepIndex.update((index) => index + 1);
  }

  protected submitByEmail(): void {
    if (!this.validateDraft().valid) {
      return;
    }
    this.emailSubmit.emit(this.draft());
    this.wizardOpen.set(false);
  }

  protected submitByWhatsApp(): void {
    if (!this.validateDraft().valid) {
      return;
    }
    this.whatsappSubmit.emit(this.draft());
    this.wizardOpen.set(false);
  }

  protected updateField(field: keyof ContactInquiry, value: string): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
    this.formError.set('');
  }

  protected onContactWhatsappClick(event: MouseEvent): void {
    if (this.isInlineEditing()) {
      event.preventDefault();
      return;
    }
    this.ctaClick.emit('contact-whatsapp');
  }

  protected onInlineEdit(event: Event, path: string): void {
    const value = (event.target as HTMLElement | null)?.innerText ?? '';
    this.inlineEdit.emit({ path, value: value.trim() });
  }

  private validateDraft(): { valid: boolean } {
    const draft = this.draft();
    const checks: Array<{ field: keyof ContactInquiry; message: string; cardId: string }> = [
      { field: 'name', message: 'Please enter your name.', cardId: 'contact' },
      { field: 'email', message: 'Please enter a valid email.', cardId: 'contact' },
      { field: 'phone', message: 'Please enter your phone or WhatsApp number.', cardId: 'contact' },
      { field: 'weddingType', message: 'Please choose the wedding type.', cardId: 'wedding-type' },
      { field: 'date', message: 'Please choose a wedding date.', cardId: 'date' },
      { field: 'guests', message: 'Please choose guest count.', cardId: 'guests' },
      { field: 'location', message: 'Please choose preferred location.', cardId: 'location' },
      { field: 'budget', message: 'Please choose budget.', cardId: 'budget' }
    ];

    for (const check of checks) {
      const value = draft[check.field].trim();
      if (!this.isFieldSatisfied(check.field, value)) {
        this.formError.set(check.message);
        this.scrollToCard(check.cardId);
        return { valid: false };
      }
    }

    const email = draft.email.trim();
    if (!email.includes('@') || !email.includes('.')) {
      this.formError.set('Please enter a valid email.');
      this.scrollToCard('contact');
      return { valid: false };
    }

    return { valid: true };
  }

  private isFieldSatisfied(field: keyof ContactInquiry, value: string): boolean {
    if (field === 'email') {
      return value.includes('@') && value.includes('.');
    }
    return value.length > 0;
  }

  private stepErrorMessage(field: keyof ContactInquiry): string {
    switch (field) {
      case 'name':
        return 'Please enter your name.';
      case 'email':
        return 'Please enter a valid email.';
      case 'phone':
        return 'Please enter your phone or WhatsApp number.';
      case 'weddingType':
        return 'Please choose the wedding type.';
      case 'date':
        return 'Please choose a wedding date.';
      case 'guests':
        return 'Please choose guest count.';
      case 'location':
        return 'Please choose preferred location.';
      case 'budget':
        return 'Please choose budget.';
      default:
        return 'Please complete this step.';
    }
  }

  private scrollToCard(cardId: string): void {
    const root = this.host.nativeElement as HTMLElement;
    const card = root.querySelector(`[data-card="${cardId}"]`) as HTMLElement | null;
    if (!card) {
      return;
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

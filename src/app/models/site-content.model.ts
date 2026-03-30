export type Language = 'en' | 'ka';

export type NavItem = {
  label: string;
  href: string;
};

export type ContentSection = {
  siteTagline: string;
  brandName: string;
  navItems: NavItem[];
  headerCta: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    tertiaryCta: string;
    stats: { value: string; label: string }[];
  };
  flow: {
    eyebrow: string;
    title: string;
    steps: string[];
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    cta: string;
    cardTitle: string;
    differentiators: string[];
  };
  services: {
    eyebrow: string;
    title: string;
    items: {
      title: string;
      description: string;
      items: string[];
      cta: string;
    }[];
  };
  packages: {
    eyebrow: string;
    title: string;
    items: {
      title: string;
      guests: string;
      price: string;
      description: string;
      items: string[];
      cta: string;
      featured?: boolean;
    }[];
  };
  destinations: {
    eyebrow: string;
    title: string;
    description: string;
    items: { title: string; description: string }[];
    cta: string;
  };
  portfolio: {
    eyebrow: string;
    title: string;
    groups: string[];
    cta: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: { quote: string; name: string; country: string }[];
    cta: string;
  };
  blog: {
    eyebrow: string;
    title: string;
    badge: string;
    items: string[];
    cta: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    answer: string;
    items: string[];
  };
  extras: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    labels: {
      name: string;
      email: string;
      phone: string;
      weddingType: string;
      date: string;
      guests: string;
      location: string;
      budget: string;
      message: string;
    };
    placeholders: {
      name: string;
      email: string;
      phone: string;
      weddingType: string;
      guests: string;
      location: string;
      budget: string;
      message: string;
    };
    actions: {
      consultation: string;
      inquiry: string;
      call: string;
    };
    cardTitle: string;
    reasons: string[];
    channels?: {
      email?: string;
      whatsapp?: string;
      whatsappNumber?: string;
    };
  };
  landing?: LandingContentConfig;
};

export type LandingContentConfig = {
  heroImageSrc?: string;
  heroImageAlt?: string;
  rsvpNowLabel?: string;
  viewDetailsLabel?: string;
  eventInfoEyebrow?: string;
  eventEssentialsTitle?: string;
  eventEssentialsDescription?: string;
  eventEssentials?: { label: string; value: string }[];
  eventTimelineTitle?: string;
  eventTimeline?: string[];
  mapLink?: string;
  openMapLabel?: string;
  galleryEyebrow?: string;
  galleryTitle?: string;
  galleryPhotos?: { src: string; alt: string }[];
  plusOneLabel?: string;
  plusOneOptions?: { value: string; label: string }[];
  quickContactLabel?: string;
  dietaryLabel?: string;
  contactEyebrow?: string;
  contactTitle?: string;
  contactDescription?: string;
  sendByEmailLabel?: string;
  sendByWhatsappLabel?: string;
  responseTimeLabel?: string;
  openWhatsappLabel?: string;
  footerTitle?: string;
};

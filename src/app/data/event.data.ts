import { NavItem } from '../models/site-content.model';

export type EventFact = { label: string; value: string };
export type MediaPhoto = { src: string; alt: string };
export type SelectOption = { value: string; label: string };

export const MAP_LINK = 'https://maps.app.goo.gl/RVZkUfD7NhVjrcfW8';

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Details', href: '#essentials' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' }
];

export const EVENT_ESSENTIALS: EventFact[] = [
  { label: 'Date', value: 'September 12, 2026' },
  { label: 'Time', value: '5:00 PM ceremony, 7:00 PM reception' },
  { label: 'Venue', value: 'Wedding Palace, Tbilisi' },
  { label: 'Dress code', value: 'Formal / Black tie optional' }
];

export const EVENT_TIMELINE: string[] = [
  '5:00 PM - Guest arrival',
  '5:30 PM - Ceremony',
  '7:00 PM - Dinner',
  '9:00 PM - Dancing'
];

export const PLUS_ONE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Maybe', label: 'Maybe' }
];

export const GALLERY_PHOTOS: MediaPhoto[] = [
  {
    src: '/assets/images/L2D100242.JPG',
    alt: 'Bride and groom portrait during sunset'
  },
  {
    src: '/assets/images/L2D10028.JPG',
    alt: 'Wedding table decoration and flowers'
  },
  {
    src: '/assets/images/L2D100436.JPG',
    alt: 'Outdoor wedding ceremony seating setup'
  },
  {
    src: '/assets/images/L2D100446.JPG',
    alt: 'Guests celebrating on the dance floor'
  }
];

export type ContactInquiry = {
  name: string;
  email: string;
  phone: string;
  weddingType: string;
  date: string;
  guests: string;
  location: string;
  budget: string;
  plusOne: string;
  dietary: string;
  message: string;
};

export type InquirySubmission = {
  inquiry: ContactInquiry;
  honeypot: string;
  formStartedAt: number;
  captchaToken: string;
};

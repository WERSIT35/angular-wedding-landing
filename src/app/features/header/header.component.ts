import { Component, input, output } from '@angular/core';
import { Language, NavItem } from '../../models/site-content.model';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  public readonly currentLanguage = input.required<Language>();
  public readonly siteTagline = input.required<string>();
  public readonly brandName = input.required<string>();
  public readonly navItems = input.required<NavItem[]>();
  public readonly rsvpNowLabel = input.required<string>();

  public readonly languageChange = output<Language>();
  public readonly ctaClick = output<string>();

  protected setLanguage(language: Language): void {
    this.languageChange.emit(language);
  }

  protected onHeaderCtaClick(event: MouseEvent): void {
    event.preventDefault();
    this.ctaClick.emit('header');
  }
}

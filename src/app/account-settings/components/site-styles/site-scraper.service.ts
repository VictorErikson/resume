import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ScrapedStyles {
  topColors: { color: string }[];
  topFonts: { fontFamily: string }[];
}

@Injectable({ providedIn: 'root' })
export class SiteScraperService {
  getStylesFromSite(_domain: string): Observable<ScrapedStyles> {
    return of({
      topColors: [{ color: '#2f6fed' }, { color: '#50c878' }, { color: '#1a1a1a' }],
      topFonts: [{ fontFamily: 'Inter, sans-serif' }],
    });
  }
}

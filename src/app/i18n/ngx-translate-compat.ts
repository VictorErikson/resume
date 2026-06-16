import { inject, Injectable, NgModule, Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LanguageService } from './language.service';
import { resolveTranslation } from './demo-i18n';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly lang = inject(LanguageService).lang;

  instant(key: string, params?: object): string {
    return resolveTranslation(key, this.lang(), params as Record<string, unknown> | undefined);
  }

  get(key: string, params?: object): Observable<string> {
    return of(this.instant(key, params));
  }
}

@Pipe({ name: 'translate', standalone: false, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService).lang;

  transform(key: string | null | undefined, params?: object): string {
    if (!key) {
      return '';
    }
    return resolveTranslation(key, this.lang(), params as Record<string, unknown> | undefined);
  }
}

@NgModule({
  declarations: [TranslatePipe],
  exports: [TranslatePipe],
})
export class TranslateModule {
  static forRoot(): { ngModule: typeof TranslateModule; providers: [] } {
    return { ngModule: TranslateModule, providers: [] };
  }
  static forChild(): { ngModule: typeof TranslateModule; providers: [] } {
    return { ngModule: TranslateModule, providers: [] };
  }
}

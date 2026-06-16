import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SnackComponent } from 'app/shared/snack/snack.component';

@Injectable({ providedIn: 'root' })
export class SnackBarService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  success(translationKey = 'generic.success', subTranslationKey = '', duration = 4000): void {
    this.open(translationKey, subTranslationKey, ['snack-bar', 'snack-bar--success'], duration);
  }

  error(translationKey = 'generic.error', subTranslationKey = '', duration = 6000): void {
    this.open(translationKey, subTranslationKey, ['snack-bar', 'snack-bar--error'], duration);
  }

  info(translationKey: string, subTranslationKey = '', duration = 4000): void {
    this.open(translationKey, subTranslationKey, ['snack-bar', 'snack-bar--info'], duration);
  }

  warning(translationKey: string, subTranslationKey = '', duration = 5000): void {
    this.open(translationKey, subTranslationKey, ['snack-bar', 'snack-bar--warning'], duration);
  }

  private open(
    translationKey: string,
    subTranslationKey: string,
    panelClass: string[],
    duration: number,
  ): void {
    this.snackBar.openFromComponent(SnackComponent, {
      data: {
        messageText: this.translate.instant(translationKey),
        subMessageText: subTranslationKey ? this.translate.instant(subTranslationKey) : '',
      },
      duration,
      panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

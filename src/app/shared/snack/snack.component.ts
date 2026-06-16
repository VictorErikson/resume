import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

export interface SnackData {
  messageText: string;
  subMessageText?: string;
}

@Component({
  selector: 'app-snack',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <p class="message-text" [innerHTML]="data.messageText"></p>
    </div>
    @if (data.subMessageText) {
      <p class="message-sub-text">{{ data.subMessageText }}</p>
    }
    <mat-icon class="snack-close-btn" (click)="closeSnack()">close</mat-icon>
  `,
  styles: [
    `
      .message-text,
      .message-sub-text {
        margin: 0;
        line-height: normal;
      }
      .message-sub-text {
        margin-top: -3px;
      }
    `,
  ],
})
export class SnackComponent {
  readonly data = inject<SnackData>(MAT_SNACK_BAR_DATA);
  private readonly snackRef = inject(MatSnackBarRef<SnackComponent>);

  closeSnack(): void {
    this.snackRef.dismiss();
  }
}

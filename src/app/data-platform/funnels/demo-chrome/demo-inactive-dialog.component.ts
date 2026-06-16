import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-demo-inactive-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-inactive">
      <div class="demo-inactive__header">
        <div class="demo-inactive__icon">
          <mat-icon>visibility</mat-icon>
        </div>
        <h2 class="demo-inactive__title">Demo view</h2>
      </div>

      <mat-dialog-content class="demo-inactive__body">
        <p>
          These menus are just for show — a recreation of the Triggerbee app shell so the demo feels
          real. Only this page is interactive.
        </p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="demo-inactive__actions">
        <button mat-flat-button mat-dialog-close class="demo-inactive__ok">Got it</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .demo-inactive {
        font-family: 'Source Sans Pro', sans-serif;
        width: 360px;
        max-width: 90vw;
      }

      .demo-inactive__header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #516ce3 0%, #6f59d8 100%);
        color: #fff;
      }
      .demo-inactive__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }
      .demo-inactive__icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .demo-inactive__title {
        margin: 0;
        font-size: 19px;
        font-weight: 600;
        line-height: 1.2;
      }

      .demo-inactive__body {
        padding: 18px 24px 4px;
      }
      .demo-inactive__body p {
        margin: 0;
        color: #444;
        line-height: 1.5;
        font-size: 14px;
      }

      .demo-inactive__actions {
        padding: 0px 20px 16px;
      }
      .demo-inactive__ok.mat-mdc-unelevated-button {
        background: #516ce3;
        color: #fff;
        border-radius: 8px;
        font-weight: 600;
        padding: 0 20px;
      }
    `,
  ],
})
export class DemoInactiveDialogComponent {}

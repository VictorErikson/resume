import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DemoInactiveDialogComponent } from './demo-inactive-dialog.component';

@Component({
  selector: 'app-demo-top-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrapper">
      <div class="top-menu-left-side">
        <a class="triggerbee-logo-container" (click)="onInactiveClick()" title="Triggerbee (demo)">
          <img
            class="triggerbee-logo"
            src="/assets/img/triggerbee-logo-black.svg"
            alt="Triggerbee"
          />
        </a>
        <div class="top-menu-divider"></div>
        <div class="top-menu-title">Funnels</div>
      </div>

      <ul class="header-list top-menu-right-side">
        <li class="header-list__item hide-on-mobile">
          <button type="button" class="selector" (click)="onInactiveClick()">
            <span class="material-icons selector__lead">apartment</span>
            <span class="selector__text">All accounts</span>
            <span class="material-icons selector__caret">expand_more</span>
          </button>
        </li>
        <li class="header-list__item">
          <button type="button" class="selector" (click)="onInactiveClick()">
            <span class="material-icons selector__lead">language</span>
            <span class="selector__text">store.example.com</span>
            <span class="material-icons selector__caret">expand_more</span>
          </button>
        </li>
      </ul>
    </div>
  `,
  styleUrl: './demo-top-menu.component.scss',
})
export class DemoTopMenuComponent {
  private readonly dialog = inject(MatDialog);

  onInactiveClick(): void {
    this.dialog.open(DemoInactiveDialogComponent, {
      panelClass: 'demo-inactive-panel',
      autoFocus: false,
    });
  }
}

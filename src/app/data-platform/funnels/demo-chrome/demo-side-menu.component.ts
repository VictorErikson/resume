import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DemoInactiveDialogComponent } from './demo-inactive-dialog.component';

interface NavItem {
  icon: string;
  iconType: 'custom' | 'material';
  label: string;
  active?: boolean;
  expanded?: boolean;
  children?: { label: string; active?: boolean }[];
}

@Component({
  selector: 'app-demo-side-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-menu">
      <ul class="side-menu-navigation">
        @for (item of navItems; track item.label) {
          <li class="side-menu-navigation__item">
            <div class="navigation-item" [class.navigation-item--selected]="item.active">
              <a class="navigation-item__link" (click)="onInactiveClick()">
                @if (item.iconType === 'custom') {
                  <span class="navigation-item__icon {{ item.icon }}"></span>
                } @else {
                  <span class="navigation-item__icon material-icons">{{ item.icon }}</span>
                }
                <span class="navigation-item__label">{{ item.label }}</span>
              </a>
            </div>

            @if (item.expanded && item.children?.length) {
              <ul class="side-menu-sub-navigation">
                @for (child of item.children!; track child.label) {
                  <li class="navigation-item" [class.navigation-item--selected]="child.active">
                    <a class="navigation-item__link sub" (click)="onInactiveClick()">
                      <span class="navigation-item__label">{{ child.label }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </li>
        }
      </ul>

      <div class="side-menu-settings">
        <div class="navigation-item">
          <a class="navigation-item__link" (click)="onInactiveClick()">
            <span class="navigation-item__icon material-icons">settings</span>
            <span class="navigation-item__label">Settings</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './demo-side-menu.component.scss',
})
export class DemoSideMenuComponent {
  private readonly dialog = inject(MatDialog);

  readonly navItems: NavItem[] = [
    { icon: 'icon-eye', iconType: 'custom', label: 'Insights' },
    { icon: 'icon-branding_watermark', iconType: 'custom', label: 'Onsite Experiences' },
    { icon: 'icon-discount-code', iconType: 'custom', label: 'Coupons' },
    { icon: 'table_chart', iconType: 'material', label: 'Form Responses' },
    { icon: 'icon-people', iconType: 'custom', label: 'Audiences' },
    { icon: 'icon-cogs', iconType: 'custom', label: 'Automations' },
    { icon: 'bar_chart', iconType: 'material', label: 'Analytics' },
    {
      icon: 'hub',
      iconType: 'material',
      label: 'Data Platform',
      active: true,
      expanded: true,
      children: [
        { label: 'Visits' },
        { label: 'Profiles' },
        { label: 'Contacts' },
        { label: 'Analytics' },
        { label: 'Widgets' },
        { label: 'Funnels', active: true },
        { label: 'Audiences' },
        { label: 'Insights' },
      ],
    },
    { icon: 'dataset', iconType: 'material', label: 'Data Sources' },
  ];

  onInactiveClick(): void {
    this.dialog.open(DemoInactiveDialogComponent, {
      panelClass: 'demo-inactive-panel',
      autoFocus: false,
    });
  }
}

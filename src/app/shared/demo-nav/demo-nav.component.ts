import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DemoNavService } from './demo-nav.service';

@Component({
  selector: 'app-demo-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-nav.component.html',
  styleUrl: './demo-nav.component.scss',
})
export class DemoNavComponent {
  protected readonly nav = inject(DemoNavService);
  private readonly router = inject(Router);

  protected navigatePrev(): void {
    const p = this.nav.prev();
    if (p) this.router.navigate([p.route]);
  }

  protected navigateNext(): void {
    const n = this.nav.next();
    if (n) this.router.navigate([n.route]);
  }

  protected navigateBack(): void {
    this.router.navigate(['/']);
  }
}

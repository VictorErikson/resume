import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoNavComponent } from './shared/demo-nav/demo-nav.component';
import { DemoIntroComponent } from './shared/demo-intro/demo-intro.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DemoNavComponent, DemoIntroComponent],
  template: '<router-outlet /><app-demo-nav /><app-demo-intro />',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

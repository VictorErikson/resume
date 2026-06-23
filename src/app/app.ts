import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoNavComponent } from './shared/demo-nav/demo-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DemoNavComponent],
  template: '<router-outlet /><app-demo-nav />',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-onboarding-continue-button',
  templateUrl: './continue-button.component.html',
  styleUrls: ['./continue-button.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContinueButtonComponent {
  @Input() isLoading = false;
  @Input() disabled = false;
}

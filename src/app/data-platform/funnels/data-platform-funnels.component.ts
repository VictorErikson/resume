import { Component, ElementRef, ViewChild } from '@angular/core';
import { CustomFunnelBuilderComponent } from './custom-funnel-builder/custom-funnel-builder.component';

@Component({
  selector: 'app-data-platform-funnels',
  templateUrl: './data-platform-funnels.component.html',
  styleUrls: ['./data-platform-funnels.component.scss'],
  standalone: false,
})
export class DataPlatformFunnelsComponent {
  @ViewChild(CustomFunnelBuilderComponent) private builderRef!: CustomFunnelBuilderComponent;
  @ViewChild(CustomFunnelBuilderComponent, { read: ElementRef })
  private builderElRef!: ElementRef<HTMLElement>;

  public onLoadPinnedFunnel(id: string) {
    this.builderRef?.loadFunnel(id);
    this.builderElRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

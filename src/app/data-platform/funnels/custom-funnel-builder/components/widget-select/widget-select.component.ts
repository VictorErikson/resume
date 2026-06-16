import {
  Component,
  DestroyRef,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { WidgetSimpleInfo } from '../../../../../campaign/widgets.model';

@Component({
  selector: 'app-widget-select',
  standalone: false,
  host: { class: 'step-field' },
  templateUrl: './widget-select.component.html',
  styleUrls: ['./widget-select.component.scss'],
})
export class WidgetSelectComponent implements OnChanges, OnInit {
  @Input() widgets: WidgetSimpleInfo[] = [];
  @Input() value: number[] = [];
  @Output() valueChange = new EventEmitter<number[]>();

  readonly searchCtrl = new FormControl('');
  private readonly destroyRef = inject(DestroyRef);
  filteredWidgets: WidgetSimpleInfo[] = [];
  sortAsc = true;

  get summaryText(): string {
    if (!this.value.length) return '';
    if (this.value.length === 1) {
      const w = this.widgets.find((w) => w.id === this.value[0]);
      return w ? this.label(w) : '1 selected';
    }
    return `${this.value.length} widgets selected`;
  }

  get allSelected(): boolean {
    return (
      this.filteredWidgets.length > 0 &&
      this.filteredWidgets.every((w) => this.value.includes(w.id!))
    );
  }

  get noneSelected(): boolean {
    return this.value.length === 0;
  }

  ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => this.applySearch(s ?? ''));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgets']) {
      this.applySearch(this.searchCtrl.value ?? '');
    }
  }

  onMenuOpened(): void {
    this.searchCtrl.setValue('');
  }

  private applySearch(search: string): void {
    const s = search.toLowerCase();
    const list = s
      ? this.widgets.filter((w) => this.label(w).toLowerCase().includes(s))
      : [...this.widgets];
    this.filteredWidgets = this.sortList(list);
  }

  private sortList(list: WidgetSimpleInfo[]): WidgetSimpleInfo[] {
    return [...list].sort((a, b) => {
      const cmp = this.label(a).localeCompare(this.label(b));
      return this.sortAsc ? cmp : -cmp;
    });
  }

  toggleSort(): void {
    this.sortAsc = !this.sortAsc;
    this.filteredWidgets = this.sortList(this.filteredWidgets);
  }

  label(w: WidgetSimpleInfo): string {
    return `${w.campaignName} (${w.name || w.id})`;
  }

  isSelected(w: WidgetSimpleInfo): boolean {
    return this.value.includes(w.id!);
  }

  toggle(w: WidgetSimpleInfo, checked: boolean): void {
    if (checked) {
      this.valueChange.emit([...this.value, w.id!]);
    } else {
      this.valueChange.emit(this.value.filter((id) => id !== w.id));
    }
  }

  selectAll(): void {
    if (this.allSelected) return;
    const existingIds = new Set(this.value);
    const toAdd = this.filteredWidgets.map((w) => w.id!).filter((id) => !existingIds.has(id));
    this.valueChange.emit([...this.value, ...toAdd]);
  }

  clearAll(): void {
    if (this.noneSelected) return;
    this.valueChange.emit([]);
  }
}

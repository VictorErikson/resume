import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FunnelNameDialogData {
  currentName: string;
  isDuplicate?: boolean;
  existingNames?: string[];
}

@Component({
  selector: 'app-funnel-name-dialog',
  templateUrl: './funnel-name-dialog.component.html',
  styleUrls: ['./funnel-name-dialog.component.scss'],
  standalone: false,
})
export class FunnelNameDialogComponent {
  public readonly data = inject<FunnelNameDialogData>(MAT_DIALOG_DATA);
  public readonly dialogRef = inject(MatDialogRef<FunnelNameDialogComponent>);
  public readonly inputValue = signal(this.data.currentName);

  public get isSaveDisabled(): boolean {
    const trimmed = this.inputValue().trim();
    return !!trimmed && !!this.data.existingNames?.includes(trimmed);
  }

  public onInput(value: string) {
    this.inputValue.set(value);
  }

  public save(value: string) {
    const trimmed = value.trim();
    if (this.isSaveDisabled) return;
    this.dialogRef.close(trimmed || null);
  }

  public cancel() {
    this.dialogRef.close(undefined);
  }
}

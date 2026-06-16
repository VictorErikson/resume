import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ScriptNotDetectedDialogData {
  domain: string;
}

export type ScriptNotDetectedDialogResult = 'retry' | 'skip';

@Component({
  selector: 'app-script-not-detected-dialog',
  templateUrl: './script-not-detected-dialog.component.html',
  styleUrls: ['./script-not-detected-dialog.component.scss'],
  standalone: false,
})
export class ScriptNotDetectedDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ScriptNotDetectedDialogComponent>);
  readonly data: ScriptNotDetectedDialogData = inject(MAT_DIALOG_DATA);

  public openSite(): void {
    window.open(this.data.domain, '_blank');
  }

  public retry(): void {
    this.dialogRef.close('retry' satisfies ScriptNotDetectedDialogResult);
  }

  public skip(): void {
    this.dialogRef.close('skip' satisfies ScriptNotDetectedDialogResult);
  }
}

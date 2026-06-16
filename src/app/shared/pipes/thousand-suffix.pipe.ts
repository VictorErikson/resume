import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'thousandSuffix', standalone: false })
export class ThousandSuffixPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 1): string {
    if (value == null || isNaN(value)) return '0';
    const abs = Math.abs(value);
    const units = [
      { v: 1e9, s: 'B' },
      { v: 1e6, s: 'M' },
      { v: 1e3, s: 'k' },
    ];
    for (const u of units) {
      if (abs >= u.v) {
        return (value / u.v).toFixed(decimals).replace(/\.0+$/, '') + u.s;
      }
    }
    return String(value);
  }
}

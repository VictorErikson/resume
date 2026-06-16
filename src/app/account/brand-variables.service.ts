import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { BrandVariable } from './brand-variable';

const DEFAULTS: BrandVariable = {
  canvas: { backgroundColor: '#ffffff' },
  button: { backgroundColor: '#2f6fed', color: '#ffffff' },
  text: { color: '#333333', font: 'Arial, sans-serif' },
  headline: { color: '#111111' },
  label: { color: '#333333' },
  input: { color: '#333333' },
};

@Injectable({ providedIn: 'root' })
export class BrandVariablesService {
  getDefaultSettings(): Observable<BrandVariable> {
    return of(structuredClone(DEFAULTS));
  }
  create(brandVariable: BrandVariable): Observable<BrandVariable> {
    return of(brandVariable);
  }
}

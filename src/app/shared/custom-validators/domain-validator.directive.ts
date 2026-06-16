import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function domainValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isProtocol =
      control.value.indexOf('http://') !== -1 || control.value.indexOf('https://') !== -1;
    let resValue = isProtocol
      ? control.value.slice(control.value.indexOf('//') + 2)
      : control.value;
    const idxPathSlash = resValue.indexOf('/');
    resValue =
      idxPathSlash !== -1 && resValue.slice(idxPathSlash).indexOf('.') === -1
        ? resValue.slice(0, idxPathSlash)
        : resValue;
    const pattern = /^([a-zÀ-ÿ0-9]+(-[a-zÀ-ÿ0-9]+)*\.)+[a-z]{2,}$/i;
    const result = pattern.test(
      Array.isArray(resValue) ? resValue[0].trim().toLowerCase() : resValue.trim().toLowerCase(),
    );
    return result ? null : { domain: { value: resValue } };
  };
}

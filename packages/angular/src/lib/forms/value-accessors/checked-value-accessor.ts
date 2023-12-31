import { Directive, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Switch } from '@nativescript/core';
import { BaseValueAccessor } from './base-value-accessor';

const CHECKED_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CheckedValueAccessor),
  multi: true,
};

/**
 * The accessor for setting a checked property and listening to changes that is used by the
 * {@link NgModel} directives.
 *
 *  ### Example
 *  ```
 *  <Switch [(ngModel)]="model.test">
 *  ```
 */
@Directive({
  selector: 'Switch[ngModel],Switch[formControlName],Switch[formControl],' + 'switch[ngModel],switch[formControlName],switch[formControl]',
  providers: [CHECKED_VALUE_ACCESSOR],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(checkedChange)': 'onChange($event.value)',
  },
})
export class CheckedValueAccessor extends BaseValueAccessor<Switch> {
  // tslint:disable-line:directive-class-suffix
  constructor(elementRef: ElementRef) {
    super(elementRef.nativeElement);
  }

  writeValue(value: any): void {
    const normalized = super.normalizeValue(value);
    this.view.checked = normalized;
  }
}

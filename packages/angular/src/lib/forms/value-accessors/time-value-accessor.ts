import { Directive, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { TimePicker } from '@nativescript/core';
import { BaseValueAccessor } from './base-value-accessor';

const TIME_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => TimeValueAccessor),
  multi: true,
};

/**
 * The accessor for setting a time and listening to changes that is used by the
 * {@link NgModel} directives.
 *
 *  ### Example
 *  ```
 *  <TimePicker [(ngModel)]="model.test">
 *  ```
 */
@Directive({
  selector: 'TimePicker[ngModel],TimePicker[formControlName],TimePicker[formControl],' + 'timepicker[ngModel],timepicker[formControlName],timepicker[formControl],' + 'timePicker[ngModel],timePicker[formControlName],timePicker[formControl],' + 'time-picker[ngModel],time-picker[formControlName],time-picker[formControl]',
  providers: [TIME_VALUE_ACCESSOR],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(timeChange)': 'onChange($event.value)',
  },
})
export class TimeValueAccessor extends BaseValueAccessor<TimePicker> {
  // tslint:disable-line:directive-class-suffix
  constructor(elementRef: ElementRef) {
    super(elementRef.nativeElement);
  }

  writeValue(value: any): void {
    const normalized = super.normalizeValue(value);
    this.view.time = normalized;
  }
}

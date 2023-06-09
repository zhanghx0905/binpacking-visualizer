import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectSnapshot} from 'src/app/methods/select-snapshot.shared-methods';
import {nextUnitSize} from '../globals';

import {selectUnit} from '../store/selectors/i-calculation-attribute.selectors';

@Pipe({
  name: 'prettyVolume',
})
export class PrettyVolumePipe implements PipeTransform {
  constructor(private _store: Store) {}

  public async transform(
    value: number,
    prettify = true,
    decimalDigits = 2,
    hideDecimalDigitsWhenZero = false
  ): Promise<string> {
    let unit = await selectSnapshot(this._store.select(selectUnit));
    if (!prettify) {
      return `${value} ${unit}³`;
    }
    let converted = value;
    let index = nextUnitSize.findIndex(x => x.unit === unit);
    while (converted >= (nextUnitSize[index!].threshold ?? Infinity)) {
      converted = converted / Math.pow(nextUnitSize[index!].next ?? 1, 3);
      index++;
      unit = nextUnitSize[index!].unit as any;
    }
    const stringified = hideDecimalDigitsWhenZero
      ? `${parseFloat(converted.toFixed(decimalDigits))} ${unit}³`
      : `${converted.toFixed(decimalDigits)} ${unit}³`;
    // return stringified.replace('.', ',');
    return stringified;
  }
}

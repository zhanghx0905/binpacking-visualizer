import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {
  clearSolutions,
  downloadCurrentSolution,
} from '../actions/i-solution.actions';
import {selectCurrentSolution} from '../selectors/i-solution.selectors';
import {HttpClient} from '@angular/common/http';
// import { CsvService } from 'src/app/services/csv.service';
import {
  setExemplaryInputData,
  updateCalculationAttributes,
} from '../actions/i-calculation-attribute.actions';
// import { ISolutionWrapper } from 'src/app/interfaces/i-solution-wrapper.interface';
import {combineLatest} from 'rxjs';

@Injectable()
export class ISolutionEffects {
  calculationAttributesSetted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateCalculationAttributes),
      map(() => clearSolutions())
    )
  );

  downloadCurrentSolution$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(downloadCurrentSolution),
        switchMap(() =>
          combineLatest([this._store.select(selectCurrentSolution)])
        ),
        take(1),
        tap(([solution]) => {
          if (solution) {
            const sJson = JSON.stringify({
              solution: solution,
            });
            const element = document.createElement('a');
            element.setAttribute(
              'href',
              `data:text/json;charset=UTF-8,${encodeURIComponent(sJson)}`
            );
            element.setAttribute('download', `${solution.description}.json`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
        })
      ),
    {dispatch: false}
  );

  // setExemplaryInputData$ = createEffect(() => this.actions$.pipe(
  //   ofType(setExemplaryInputData),
  //   switchMap(() => this._httpClient.get('./assets/exemplaryInputData.csv', {
  //     responseType: 'text'
  //   })),
  //   map((csv) => {
  //     const extractedVariables = this._csvService.extractCSVEntities(csv);
  //     return updateCalculationAttributes(extractedVariables);
  //   })
  // ));

  constructor(
    private actions$: Actions,
    private _store: Store,
    private _httpClient: HttpClient // private _csvService: CsvService
  ) {}
}

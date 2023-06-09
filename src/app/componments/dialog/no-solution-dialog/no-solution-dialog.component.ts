import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {ISolution} from 'src/app/interfaces/i-solution.interface';
import {
  setCurrentSolution,
  setExemplarySolution,
} from 'src/app/store/actions/i-solution.actions';

import * as fromICalculationAttributesState from 'src/app/store/reducers/i-calculation-attribute.reducers';
import * as fromISolutionState from 'src/app/store/reducers/i-solution.reducers';
import {v4 as generateGuid} from 'uuid';
import * as moment from 'moment';
import calculateRandomColorSharedMethod from 'src/app/methods/calculate-random-color.shared-method';

@Component({
  selector: 'app-no-solution-dialog',
  templateUrl: './no-solution-dialog.component.html',
  styleUrls: ['./no-solution-dialog.component.css'],
})
export class NoSolutionDialogComponent implements OnInit {
  @ViewChild('uploadSolution', {read: ElementRef})
  uploadSolutionInput!: ElementRef<HTMLInputElement>;

  public canClose = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {closeControlEnabled?: boolean},
    private _ref: MatDialogRef<NoSolutionDialogComponent>,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private _calculationAttributesStore: Store<fromICalculationAttributesState.State>,
    private _solutionStore: Store<fromISolutionState.State>
  ) {}

  close = () => this._ref.close();

  ngOnInit(): void {
    this.canClose = this.data?.closeControlEnabled ?? false;
  }

  uploadOwnSolution(evt: InputEvent) {
    const file: File = (evt.target as HTMLInputElement).files![0];
    this.uploadSolutionInput.nativeElement.value = '';
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        // TODO
        const data = JSON.parse(reader.result as string);
        const iSolution = data.solution;
        const solution: ISolution = {
          id: iSolution.id ?? generateGuid(),
          calculated: moment().format(),
          calculationSource: iSolution.calculationSource ?? {
            title: 'unknown source',
          },
          container: iSolution.container ?? {
            goods: [],
            xCoord: 0,
            yCoord: 0,
            zCoord: 0,
            width: 0,
            length: 0,
            height: 0,
            unit: 'mm',
            id: generateGuid(),
          },
          description: iSolution.description ?? null,
        };
        for (let good of solution.container.goods) {
          good.color = good.color ?? calculateRandomColorSharedMethod();
        }
        this._solutionStore.dispatch(setCurrentSolution({solution}));
        this._router.navigate(['/visualizer']);
        this._ref.close();
      } catch (error) {
        this._snackBar.open(`error during solution import: ${error}`, 'ok', {
          duration: 3000,
        });
      }
    };
    reader.readAsText(file);
  }

  useExampleSolution() {
    this.close();
    this._solutionStore.dispatch(setExemplarySolution());
    this._router.navigate(['/visualizer']);
  }
}

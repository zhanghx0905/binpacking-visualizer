import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './componments/navbar/navbar.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from "@angular/material/table";
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgChartsModule } from 'ng2-charts';


import * as fromICalculationAttributesState from './store/reducers/i-calculation-attribute.reducers';
import { ICalculationAttributesEffects } from './store/effects/i-calculation-attribute.effects';
import * as fromISolutionState from './store/reducers/i-solution.reducers';
import { ISolutionEffects } from './store/effects/i-solution.effects';
import { VisualizerComponent } from './componments/visualizer/visualizer.component';
import { HttpClientModule } from '@angular/common/http';
import { NoSolutionDialogComponent } from './componments/dialog/no-solution-dialog/no-solution-dialog.component';
import { SceneVisualizationComponent } from './componments/scene-visualization/scene-visualization.component';
import { SolutionPreviewComponent } from './componments/solution-preview/solution-preview.component';
import { GoodPreviewComponent } from './componments/good-preview/good-preview.component';
import { PrettyLengthPipe } from './pipes/pretty-length.pipe';
import { SolutionValidationComponent } from './componments/solution-validation/solution-validation.component';
import { SolutionValidationErrorPipe } from './pipes/solution-validation-error.pipe';
import { PrettyVolumePipe } from './pipes/pretty-volume.pipe';
import { ContainerPreviewComponent } from './componments/container-preview/container-preview.component';
import { GoodsPanelComponent } from './componments/goods-panel/goods-panel.component';

let rootStoreFeatures: any = {};
rootStoreFeatures[fromICalculationAttributesState.calculationAttributesFeatureKey] = fromICalculationAttributesState.calculationAttributesReducer;
rootStoreFeatures[fromISolutionState.solutionFeatureKey] = fromISolutionState.solutionReducer;


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    VisualizerComponent,
    NoSolutionDialogComponent,
    SceneVisualizationComponent,
    SolutionPreviewComponent,
    GoodPreviewComponent,
    PrettyLengthPipe,
    SolutionValidationComponent,
    SolutionValidationErrorPipe,
    PrettyVolumePipe,
    ContainerPreviewComponent,
    GoodsPanelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    HttpClientModule,
    StoreModule.forRoot(rootStoreFeatures),
    EffectsModule.forRoot([ISolutionEffects, ICalculationAttributesEffects]),
    NgChartsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

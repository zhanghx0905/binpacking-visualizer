import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {VisualizerComponent} from './componments/visualizer/visualizer.component';

const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'visualizer'},
  {path: 'visualizer', component: VisualizerComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

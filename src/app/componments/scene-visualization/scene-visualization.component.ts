import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  ReplaySubject,
  Subscription,
  switchMap,
} from 'rxjs';
import {IGood} from 'src/app/interfaces/i-good.interface';
import {Scene} from 'three';
import {SceneVisualizationComponentService} from './scene-visualization-component.service';

import * as ThreeJS from 'three';

import {Store} from '@ngrx/store';
import {selectSnapshot} from 'src/app/methods/select-snapshot.shared-methods';
import {selectCurrentSolutionGoods} from 'src/app/store/selectors/i-solution.selectors';
import {
  IVisualizerContextService,
  VISUALIZER_CONTEXT,
} from 'src/app/interfaces/i-visualizer-context.service';

@Component({
  selector: 'app-scene-visualization',
  templateUrl: './scene-visualization.component.html',
  styleUrls: ['./scene-visualization.component.css'],
  providers: [SceneVisualizationComponentService],
})
export class SceneVisualizationComponent
  implements OnChanges, OnDestroy, OnInit
{
  @ViewChild('visualizationWrapper', {static: true})
  public visualizerWrapperRef!: ElementRef<HTMLDivElement>;

  @Input() public scene!: Scene;
  @Input() public responsive = true;
  @Input() public interactable = true;

  @Output() public sceneRendered = new EventEmitter<{
    canvas: HTMLCanvasElement;
  }>();
  @Output() public hoveredGood = new EventEmitter<string | null>();
  @Output() public selectGood = new EventEmitter<string | null>();

  private _hoveredGoodId = new BehaviorSubject<null | string>(null);
  public hoveredGood$ = this._hoveredGoodId.pipe(
    switchMap(goodId =>
      this._store
        .select(selectCurrentSolutionGoods)
        .pipe(map(goods => goods.find(good => good.id === goodId)))
    )
  );

  private _sceneRendered = new ReplaySubject<{canvas: HTMLCanvasElement}>(1);

  private subscription = new Subscription();

  constructor(
    @Optional()
    @Inject(VISUALIZER_CONTEXT)
    public visualizerComponentService: IVisualizerContextService,
    public sceneVisualizationComponentService: SceneVisualizationComponentService,
    private _store: Store
  ) {}

  public async highlightGood(arg: IGood | string) {
    const goodId = typeof arg === 'string' ? arg : arg.id;
    const meshes = this.scene.children.filter(
      candidate =>
        candidate instanceof ThreeJS.Mesh && !!candidate.userData['goodId']
    ) as ThreeJS.Mesh[];
    meshes.forEach(mesh => {
      (mesh.material as ThreeJS.MeshBasicMaterial)['color'].set(
        mesh.userData['goodId'] === goodId
          ? 'white'
          : mesh.userData['color'] ?? 'black'
      );
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['scene']) {
      this.tryToRender();
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public ngOnInit(): void {
    this.tryToRender();
    this.subscription.add(
      this._sceneRendered.pipe(debounceTime(1500)).subscribe(arg => {
        this.sceneRendered.emit(arg);
      })
    );
    if (this.visualizerComponentService) {
      this.subscription.add(
        this.visualizerComponentService.reRenderingTriggered$.subscribe(() =>
          this.tryToRender()
        )
      );
    }
  }

  public async resetGoodColors() {
    const meshes = this.scene.children.filter(
      candidate =>
        candidate instanceof ThreeJS.Mesh && !!candidate.userData['goodId']
    ) as ThreeJS.Mesh[];
    meshes.forEach(mesh => {
      (mesh.material as ThreeJS.MeshBasicMaterial)['color'].set(
        mesh.userData['color'] ?? 'black'
      );
    });
  }

  public tryToRender() {
    if (this.scene && this.visualizerWrapperRef) {
      const canvas =
        this.sceneVisualizationComponentService.setScreenDimensions(
          this.visualizerWrapperRef.nativeElement.clientHeight,
          this.visualizerWrapperRef.nativeElement.clientWidth
        );
      this.visualizerWrapperRef.nativeElement.appendChild(canvas);
      this.sceneVisualizationComponentService.renderScene(this.scene);
      this._sceneRendered.next({canvas: canvas});
    }
  }

  public updateSize() {
    this.sceneVisualizationComponentService.updateSize(
      this.visualizerWrapperRef.nativeElement.clientHeight,
      this.visualizerWrapperRef.nativeElement.clientWidth
    );
  }

  @HostListener('window:resize', ['$event'])
  private onResize() {
    if (!this.responsive) {
      return;
    }
    this.sceneVisualizationComponentService.updateSize(
      this.visualizerWrapperRef.nativeElement.clientHeight,
      this.visualizerWrapperRef.nativeElement.clientWidth
    );
  }

  public async onClick(event: MouseEvent) {
    if (!this.interactable) {
      return;
    }

    const hoveredElement =
      this.sceneVisualizationComponentService.getPointedElement(
        event,
        this.scene
      );
    if (!hoveredElement || !hoveredElement.object.userData['goodId']) {
      await this.resetGoodColors();
      this._hoveredGoodId.next(null);
      this.hoveredGood.emit(null);
      this.selectGood.emit(null);
      if (this.visualizerComponentService) {
        this.visualizerComponentService.selectGood(null);
      }
      return;
    }

    const goodId = hoveredElement.object.userData['goodId'];
    await this.highlightGood(goodId);
    this._hoveredGoodId.next(goodId);
    this.hoveredGood.emit(goodId);
    this.selectGood.emit(goodId);
    if (this.visualizerComponentService) {
      this.visualizerComponentService.selectGoodById(goodId);
    }
  }

  public async onMousemove(event: MouseEvent) {
    if (!this.interactable) {
      return;
    }

    const hoveredElement =
      this.sceneVisualizationComponentService.getPointedElement(
        event,
        this.scene
      );
    if (!hoveredElement || !hoveredElement.object.userData['goodId']) {
      await this.resetGoodColors();
      this._hoveredGoodId.next(null);
      this.hoveredGood.emit(null);
      if (this.visualizerComponentService) {
        this.visualizerComponentService.hoverGood(null);
      }
      return;
    }

    const goodId = hoveredElement.object.userData['goodId'];
    await this.highlightGood(goodId);
    this._hoveredGoodId.next(goodId);
    this.hoveredGood.emit(goodId);
    if (this.visualizerComponentService) {
      this.visualizerComponentService.hoverGoodById(goodId);
    }
  }
}

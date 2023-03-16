import {IContainer} from './i-container.interface';
import {IEntity} from './base/i-entity.interface';

export interface ISolution extends IEntity {
  container: IContainer;
  calculated: string; // Time
  description: string | null;
  calculationSource: {
    staticAlgorithm?: string;
    title: string;
  };
}

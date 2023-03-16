import {IEntity} from './base/i-entity.interface';
import {IPositionedElement} from './base/i-positioned.interface';
import {ISpace} from './base/i-space.interface';

export interface IGood extends IPositionedElement, ISpace, IEntity {
  desc: string | null;
  color: string;
  // group: string;
  // turningAllowed: boolean;
  // turned: boolean;
  // stackingAllowed: boolean;
  // stackedOnGood: string | null;
  // sequenceNr: number;
  // orderGuid: string;
}

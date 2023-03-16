import { IEntity } from "./base/i-entity.interface";
import { IPositionedElement } from "./base/i-positioned.interface";
import { ISpace } from "./base/i-space.interface";

export interface IDimension extends IEntity, IPositionedElement, ISpace {
    rCoord: number;
    tCoord: number;
    fCoord: number;
    points: IPositionedElement[];
}
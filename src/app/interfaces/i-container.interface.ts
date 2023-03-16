import { Unit } from "../globals";
import { IEntity } from "./base/i-entity.interface";
import { IGood } from "./i-good.interface";
import { IPositionedElement } from "./base/i-positioned.interface";
import { ISpace } from "./base/i-space.interface";

export interface IContainer extends IPositionedElement, ISpace, IEntity {
    unit: Unit;
    goods: IGood[];
}
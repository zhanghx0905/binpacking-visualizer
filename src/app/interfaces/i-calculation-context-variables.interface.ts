import { Unit } from "../globals";
import { IGood } from "./i-good.interface";

export interface ICalculationAttributesVariables {
    containerWidth: number;
    containerHeight: number;
    unit: Unit;
    goods: IGood[];
}
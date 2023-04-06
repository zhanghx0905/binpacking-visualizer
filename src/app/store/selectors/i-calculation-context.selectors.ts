import {createSelector} from '@ngrx/store';

import * as fromICalculationAttributes from '../reducers/i-calculation-attribute.reducers';

export const calculationAttributesState = (state: any) =>
  state[
    fromICalculationAttributes.calculationAttributesFeatureKey
  ] as fromICalculationAttributes.State;

export const selectCalculationContextValid = createSelector(
  calculationAttributesState,
  calculationAttributesState => {
    return (
      calculationAttributesState.containerHeight > 0 &&
      calculationAttributesState.containerWidth > 0 &&
      calculationAttributesState.unit
    );
  }
);

import type {AdUnitsProductionIds} from './adUnitSlots';

let productionAdUnits: AdUnitsProductionIds | null = null;

export function setProductionAdUnits(ids: AdUnitsProductionIds) {
  productionAdUnits = ids;
}

export function getProductionAdUnits(): AdUnitsProductionIds | null {
  return productionAdUnits;
}

import { ICategory, NewCategory } from './category.model';

export const sampleWithRequiredData: ICategory = {
  id: 8109,
  name: 'midst croon cautiously',
};

export const sampleWithPartialData: ICategory = {
  id: 15504,
  name: 'dispose',
};

export const sampleWithFullData: ICategory = {
  id: 28780,
  name: 'ouch',
};

export const sampleWithNewData: NewCategory = {
  name: 'where pfft regularly',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);

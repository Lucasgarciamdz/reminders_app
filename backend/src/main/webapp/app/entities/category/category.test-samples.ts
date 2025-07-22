import { ICategory, NewCategory } from './category.model';

export const sampleWithRequiredData: ICategory = {
  id: 8109,
  name: 'midst croon cautiously',
};

export const sampleWithPartialData: ICategory = {
  id: 7001,
  name: 'mmm summarise far',
  color: 'black',
  description: '../fake-data/blob/hipster.txt',
};

export const sampleWithFullData: ICategory = {
  id: 28780,
  name: 'ouch',
  color: 'fuchsia',
  description: '../fake-data/blob/hipster.txt',
};

export const sampleWithNewData: NewCategory = {
  name: 'where pfft regularly',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);

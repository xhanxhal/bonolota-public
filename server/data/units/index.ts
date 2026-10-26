import { UnitInfo, VocabWord } from '../types';
import { unit01 } from './unit-01';
import { unit02 } from './unit-02';
import { unit03 } from './unit-03';
import { unit04 } from './unit-04';
import { unit05 } from './unit-05';
import { unit06 } from './unit-06';
import { unit07 } from './unit-07';
import { unit08 } from './unit-08';
import { unit09 } from './unit-09';
import { unit10 } from './unit-10';
import { unit11 } from './unit-11';
import { unit12 } from './unit-12';
import { unit13 } from './unit-13';
import { unit14 } from './unit-14';
import { unit15 } from './unit-15';
import { unit16 } from './unit-16';
import { unit17 } from './unit-17';
import { unit18 } from './unit-18';
import { unit19 } from './unit-19';
import { unit20 } from './unit-20';
import { unit21 } from './unit-21';
import { unit22 } from './unit-22';
import { unit23 } from './unit-23';
import { unit24 } from './unit-24';
import { unit25 } from './unit-25';
import { unit26 } from './unit-26';
import { unit27 } from './unit-27';
import { unit28 } from './unit-28';
import { unit29 } from './unit-29';
import { unit30 } from './unit-30';
import { unit31 } from './unit-31';
import { unit32 } from './unit-32';
import { unit33 } from './unit-33';
import { unit34 } from './unit-34';
import { unit35 } from './unit-35';
import { unit36 } from './unit-36';
import { unit37 } from './unit-37';
import { unit38 } from './unit-38';
import { unit39 } from './unit-39';
import { unit40 } from './unit-40';
import { unit41 } from './unit-41';
import { unit42 } from './unit-42';
import { unit43 } from './unit-43';
import { unit44 } from './unit-44';
import { unit45 } from './unit-45';
import { unit46 } from './unit-46';
import { unit47 } from './unit-47';
import { unit48 } from './unit-48';
import { unit49 } from './unit-49';
import { unit50 } from './unit-50';

export const allUnits: UnitInfo[] = [
  unit01,
  unit02,
  unit03,
  unit04,
  unit05,
  unit06,
  unit07,
  unit08,
  unit09,
  unit10,
  unit11,
  unit12,
  unit13,
  unit14,
  unit15,
  unit16,
  unit17,
  unit18,
  unit19,
  unit20,
  unit21,
  unit22,
  unit23,
  unit24,
  unit25,
  unit26,
  unit27,
  unit28,
  unit29,
  unit30,
  unit31,
  unit32,
  unit33,
  unit34,
  unit35,
  unit36,
  unit37,
  unit38,
  unit39,
  unit40,
  unit41,
  unit42,
  unit43,
  unit44,
  unit45,
  unit46,
  unit47,
  unit48,
  unit49,
  unit50,
];

export const getAllUnits = (): UnitInfo[] => {
  return allUnits;
};

export const getUnitById = (id: number): UnitInfo | undefined => {
  return allUnits.find(u => u.id === id);
};

export const getWordsByUnit = (unitId: number): VocabWord[] => {
  const unit = allUnits.find(u => u.id === unitId);
  return unit ? unit.words : [];
};

export const getAllWords = (): VocabWord[] => {
  return allUnits.flatMap(u => u.words);
};

export const getWordById = (wordId: string): VocabWord | undefined => {
  for (const u of allUnits) {
    const found = u.words.find(w => w.id === wordId);
    if (found) return found;
  }
  return undefined;
};

export const getTotalWordCount = (): number => {
  return allUnits.reduce((acc, u) => acc + u.words.length, 0);
};

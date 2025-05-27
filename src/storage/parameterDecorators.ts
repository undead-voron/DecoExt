import { storageParamFactory } from './onChanged';

// Parameter decorator for the 'changes' object from storage.onChanged
export const storageChanges = storageParamFactory('allChanges');

// Parameter decorator for the 'areaName' string from storage.onChanged
export const storageAreaName = storageParamFactory('areaName');

// Parameter decorator for the specific StorageChange object 
// (if a key was provided to onStorageChanged options)
export const storageItemChange = storageParamFactory('specificChange');

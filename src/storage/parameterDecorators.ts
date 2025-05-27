import { createDecorator } from '~/buildDecoratorAndMethodWrapper';
import { storageMetadataKey } from './onChanged'; // storageMetadataKey is a Symbol

// Parameter decorator for the 'changes' object from storage.onChanged
export const StorageChanges = createDecorator<'allChanges'>(storageMetadataKey).decorator;

// Parameter decorator for the 'areaName' string from storage.onChanged
export const StorageAreaName = createDecorator<'areaName'>(storageMetadataKey).decorator;

// Parameter decorator for the specific StorageChange object 
// (if a key was provided to onStorageChanged options)
export const StorageItemChange = createDecorator<'specificChange'>(storageMetadataKey).decorator;

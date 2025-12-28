import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We must use a class that implements the EventEmitter interface to get proper typings.
class TypedEventEmitter extends EventEmitter {
  emit<T extends keyof AppEvents>(event: T, ...args: Parameters<AppEvents[T]>): boolean {
    return super.emit(event, ...args);
  }

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): this {
    return super.on(event, listener);
  }
}

export const errorEmitter = new TypedEventEmitter();

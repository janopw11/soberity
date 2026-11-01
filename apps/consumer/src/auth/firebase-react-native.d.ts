import type { Persistence } from 'firebase/auth';

// Metro loads the React Native build of firebase/auth, which exports this helper,
// but the public typings do not include it.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}

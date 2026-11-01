/**
 * Type-level entry point for TypeScript. Metro always resolves
 * `firebaseInstance.web.ts` or `firebaseInstance.native.ts` first, so this
 * re-export is only used for type checking.
 */
export { getFirebaseAuth } from './firebaseInstance.native';

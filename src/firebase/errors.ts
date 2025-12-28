export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// A custom error class for Firestore permission errors
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    const contextString = JSON.stringify(context, null, 2);
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${contextString}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is necessary for the error to be properly serialized by Next.js
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}

const firebaseErrorKeys: Record<string, string> = {
  'auth/email-already-in-use': 'errors.emailAlreadyInUse',
  'auth/invalid-email': 'errors.invalidEmail',
  'auth/weak-password': 'errors.weakPassword',
  'auth/user-not-found': 'errors.userNotFound',
  'auth/wrong-password': 'errors.wrongPassword',
  'auth/invalid-credential': 'errors.invalidCredential',
  'auth/too-many-requests': 'errors.tooManyRequests',
  'auth/network-request-failed': 'errors.networkRequestFailed',
  'auth/user-disabled': 'errors.userDisabled',
};

export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof Error) {
    const code = (error as any).code as string | undefined;
    if (code && firebaseErrorKeys[code]) return t(firebaseErrorKeys[code]);
    return error.message;
  }
  return t('errors.generic');
}

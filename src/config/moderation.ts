import { IdTokenResult } from 'firebase/auth';

// Moderator status is granted exclusively via a Firebase custom claim
// (`moderator: true`), set server-side by the local `set-moderator.js` script.
// There are deliberately no hardcoded emails — the claim travels inside the
// signed ID token, so it can't be spoofed by the client and the security rules
// can verify the same flag (`request.auth.token.moderator == true`).
export function isModerator(token: IdTokenResult | null | undefined): boolean {
  return token?.claims?.moderator === true;
}

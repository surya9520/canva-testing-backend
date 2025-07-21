import crypto from 'crypto';

export function generatePKCECodes() {
  const code_verifier = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(code_verifier).digest();
  const code_challenge = hash.toString('base64url');
  return { code_verifier, code_challenge };
}

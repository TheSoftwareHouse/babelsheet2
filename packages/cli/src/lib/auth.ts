import { promises as fs } from 'fs';
import type { JWTInput } from 'google-auth-library';
import { google } from 'googleapis';

const CREDENTIALS_FILE_REQUIRED_KEYS = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri', 'auth_provider_x509_cert_url', 'client_x509_cert_url'];

type UnwrapPromise<T> = T extends Promise<infer Inner> ? UnwrapPromise<Inner> : T;

export type GoogleAuth = UnwrapPromise<ReturnType<typeof authorize>>;

export async function parseCredentialsFile(filePath: string) {
  const fileBuffer = await fs.readFile(filePath);

  let parsedContent: any;
  try {
    parsedContent = JSON.parse(fileBuffer.toString());
    // eslint-disable-next-line no-empty
  } catch {}

  if (
    !parsedContent
    || typeof parsedContent !== 'object'
    || CREDENTIALS_FILE_REQUIRED_KEYS.some((key) => typeof (parsedContent as any)[key] !== 'string')
  ) {
    throw new Error('Invalid credentials file format');
  }

  if (parsedContent.type !== 'service_account') {
    throw new Error('Only "service_account" type credentials are supported');
  }

  return parsedContent as Required<JWTInput>;
}

export function authorize(credentials: JWTInput, scopes: string[]) {
  return new google.auth.GoogleAuth({
    credentials,
    scopes,
  }).getClient();
}

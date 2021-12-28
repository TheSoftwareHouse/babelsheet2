import { google } from 'googleapis';
import { GoogleAuth } from './auth';

export type FileShareConfig = {
  auth: GoogleAuth;
  role: 'writer',
  fileId: string;
  email: string;
  sendNotificationEmail?: boolean;
}

export type DeleteDriveFileConfig = {
  auth: GoogleAuth;
  fileId: string;
};

export async function shareFileWithEmail({
  auth,
  role,
  fileId,
  email,
  sendNotificationEmail = true,
}: FileShareConfig) {
  await google.drive({
    auth,
    version: 'v3',
  }).permissions.create({
    requestBody: {
      type: 'user',
      emailAddress: email,
      role,
    },
    fileId,
    sendNotificationEmail,
  });
}

export async function deleteDriveFile({
  auth,
  fileId,
}: DeleteDriveFileConfig) {
  await google.drive({ auth, version: 'v3' }).files.delete({
    fileId,
  });
}

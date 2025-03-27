export type Credentials = {
  client_email?: string;
  private_key?: string;
}

type UsingSheetsAPI = {
  sheetIndex?: number;
  /** @experimental */
  isUsingCsvExport?: false;
}

type UsingDriveCsvAPI = {
  sheetIndex?: never;
  /** @experimental */
  isUsingCsvExport: true;
}

export type FromBabelsheetConfig = (UsingSheetsAPI | UsingDriveCsvAPI) &{
  spreadsheetId: string;
  credentials: Credentials;
}

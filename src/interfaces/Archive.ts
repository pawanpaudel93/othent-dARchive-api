export interface GetTokenSilentlyVerboseResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope?: string;
}

export interface SendTransactionBundlrProps {
  data: Buffer;
  JWT: string;
  tags?: {
    name: string;
    value: string;
  }[];
}

export interface SendTransactionBundlrReturnProps {
  success: boolean;
  transactionId: string;
}

interface ManifestPath {
  id: string;
}

export interface Manifest {
  manifest: string;
  version: string;
  index: {
    path: string;
  };
  paths: Record<string, ManifestPath>;
}

export enum Status {
  Success = "success",
  Error = "error",
}

export interface ArchiveResponse {
  status: Status.Success | Status.Error;
  message?: string;
  data?: {
    txID: string;
    title: string;
    timestamp: number;
  };
}

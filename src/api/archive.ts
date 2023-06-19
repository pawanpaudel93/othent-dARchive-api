import { HtmlScreenshotSaver } from 'save-html-screenshot';
import express from 'express';
import fsPromises from 'node:fs/promises';
import path from 'path';
import mime from 'mime-types';
import { createHash } from 'crypto';
import type { Buffer } from 'node:buffer';
import fetch, { FormData, Blob } from 'node-fetch';
import {
  GetTokenSilentlyVerboseResponse,
  SendTransactionBundlrProps,
  SendTransactionBundlrReturnProps,
  ArchiveResponse,
  Manifest,
  Status,
} from '../interfaces/Archive.js';

const router = express.Router();

const APP_NAME = 'Arweave-Archive';
const APP_VERSION = '0.1.0';
const MANIFEST_CONTENT_TYPE = 'application/x.arweave-manifest+json';

async function sendTransactionBundlr(
  params: SendTransactionBundlrProps,
): Promise<SendTransactionBundlrReturnProps> {
  const data = params.data;

  const blob = new Blob([data]);

  const formData = new FormData();

  formData.append('file', blob);
  formData.append('dataHashJWT', params.JWT);
  formData.append('API_ID', process.env.NEXT_PUBLIC_OTHENT_API_ID as string);
  formData.append('tags', JSON.stringify(params.tags));

  try {
    const response = (await (
      await fetch(
        'https://server.othent.io/upload-data-bundlr',
        {
          method: 'POST',
          body: formData,
        },
      )
    ).json()) as SendTransactionBundlrReturnProps;
    return response;
  } catch (error) {
    throw error;
  }
}

async function prepareManifest(
  manifest: Manifest,
  timestamp: number,
  title: string,
  url: string,
  address: string,
) {
  const manifestData = JSON.stringify(manifest);
  const manifestTags = [
    { name: 'App-Name', value: APP_NAME },
    { name: 'App-Version', value: APP_VERSION },
    { name: 'Content-Type', value: MANIFEST_CONTENT_TYPE },
    { name: 'Title', value: title },
    { name: 'Type', value: 'archive' },
    { name: 'Url', value: url },
    { name: 'Timestamp', value: String(timestamp) },
    { name: 'Archiver', value: address },
  ];
  return { manifestData, manifestTags };
}

async function toHash(data: Buffer): Promise<string> {
  const hashBuffer = createHash('sha256').update(data).digest();
  const hashHex = hashBuffer.toString('hex');
  return hashHex;
}

async function prepareFile(
  filePath: string,
  title: string,
  url: string,
  timestamp: number,
  isIndexFile: boolean,
) {
  const data = await fsPromises.readFile(filePath);
  const hash = await toHash(data);

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  const tags = [
    { name: 'App-Name', value: APP_NAME },
    { name: 'App-Version', value: APP_VERSION },
    { name: 'Content-Type', value: mimeType },
    { name: isIndexFile ? 'page:title' : 'screenshot:title', value: title },
    { name: isIndexFile ? 'page:url' : 'screenshot:url', value: url },
    {
      name: isIndexFile ? 'page:timestamp' : 'screenshot:timestamp',
      value: String(timestamp),
    },
    { name: 'File-Hash', value: hash },
  ];
  return { data, tags };
}

async function uploadToBundlr(
  data: Buffer | string,
  tags: any,
  accessToken: GetTokenSilentlyVerboseResponse,
): Promise<string> {
  const response = await sendTransactionBundlr({
    data: data as unknown as Buffer,
    JWT: accessToken.id_token,
    tags,
  });
  if (response.success) {
    return response.transactionId;
  } else {
    return uploadToBundlr(data, tags, accessToken);
  }
}

router.post<{}, ArchiveResponse>('/', async (req, res) => {
  let folderPath = '';
  try {
    const { url, accessToken, address } = req.body;
    const saver = new HtmlScreenshotSaver(
      {
        browserlessOptions: process.env.BROWSERLESS_API_KEY
          ? {
            apiKey: process.env.BROWSERLESS_API_KEY,
            timeout: 60000,
          }
          : undefined,
      },
    );

    const result = await saver.save(url);

    if (result.status === 'success') {
      const manifest: Manifest = {
        manifest: 'arweave/paths',
        version: '0.1.0',
        index: {
          path: 'index.html',
        },
        paths: {},
      };
      folderPath = result.webpage.replace('index.html', '');
      const files = await fsPromises.readdir(folderPath);

      await Promise.all(
        files
          .filter((file) => !file.includes('metadata.json'))
          .map(async (file) => {
            const filePath = path.join(folderPath, file);
            const isIndexFile = filePath.includes('index.html');
            const { data, tags } = await prepareFile(
              filePath,
              result.title,
              url,
              result.timestamp,
              isIndexFile,
            );
            const transactionId = await uploadToBundlr(data, tags, accessToken);
            manifest.paths[isIndexFile ? 'index.html' : 'screenshot'] = {
              id: transactionId,
            };
          }),
      );

      const { manifestData, manifestTags } = await prepareManifest(
        manifest,
        result.timestamp,
        result.title,
        url,
        address,
      );

      const transactionId = await uploadToBundlr(
        manifestData,
        manifestTags,
        accessToken,
      );

      await fsPromises.rm(folderPath, { recursive: true, force: true });

      const jsonResponse = {
        status: result.status === 'success' ? Status.Success : Status.Error,
        data: {
          txID: transactionId,
          title: result.title,
          timestamp: result.timestamp,
        },
      };
      return res.status(200).json(jsonResponse);
    } else {throw Error(result.message);}
  } catch (error: any) {
    if (folderPath) {
      await fsPromises.rm(folderPath, { recursive: true, force: true });
    }
    const errorResponse = {
      status: Status.Error,
      message: error.message as string,
    };
    return res.status(500).json(errorResponse);
  }
});

export default router;

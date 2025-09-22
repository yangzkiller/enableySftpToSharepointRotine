import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import fetch from 'node-fetch';
import { logInfo, logError } from './logger.mjs';

export async function getAccessToken(clientId, clientSecret, tenantId) {
  try {
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const res = await fetch(url, { method: 'POST', body: params });
    const data = await res.json();

    if (!data.access_token) {
      throw new Error(`Erro ao gerar token: ${JSON.stringify(data)}`);
    }

    logInfo('Access token gerado com sucesso');
    return data.access_token;
  } catch (err) {
    logError('Erro ao gerar access token', err);
    throw err;
  }
}

function getGraphClient(accessToken) {
  return Client.init({ authProvider: done => done(null, accessToken) });
}

export async function getSiteId(accessToken, siteUrl) {
  try {
    const url = new URL(siteUrl);
    const hostname = url.hostname;
    const sitePath = url.pathname.replace(/^\/+/, ''); 

    const client = getGraphClient(accessToken);
    const site = await client.api(`/sites/${hostname}:/${sitePath}`).get();
    logInfo(`SiteId obtido: ${site.id}`);
    return site.id;
  } catch (err) {
    logError('Erro ao obter siteId', err);
    throw err;
  }
}

export async function getDriveId(accessToken, siteId, driveName) {
  try {
    const client = getGraphClient(accessToken);
    const drives = await client.api(`/sites/${siteId}/drives`).get();
    const drive = drives.value.find(d => d.name === driveName);
    if (!drive) throw new Error(`Drive ${driveName} não encontrado`);
    logInfo(`DriveId obtido: ${drive.id}`);
    return drive.id;
  } catch (err) {
    logError('Erro ao obter driveId', err);
    throw err;
  }
}

export async function uploadFileStream(accessToken, siteId, driveId, folderPath, readStream, fileName) {
  try {
    const client = getGraphClient(accessToken);
    const uploadPath = `${folderPath}/${fileName}`;

    await client
      .api(`/sites/${siteId}/drives/${driveId}/root:/${uploadPath}:/content`)
      .put(readStream);

    logInfo(`Upload concluído no SharePoint`, { fileName, uploadPath });
  } catch (err) {
    logError('Erro no upload para SharePoint', err);
    throw err;
  }
}

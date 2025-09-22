import { processLatestFiles } from './sftp.mjs';
import { uploadFileStream, getAccessToken, getSiteId, getDriveId } from './sharepoint.mjs';
import { logInfo, logError } from './logger.mjs';

export async function handler(event) {
  const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || 22,
    username: process.env.SFTP_USER,
    privateKey: process.env.SFTP_KEY.replace(/\\n/g, '\n')
  };

  const remoteDir = process.env.REMOTE_DIR;
  const sharePointFolder = process.env.SPO_FOLDER;

  try {
    logInfo('Início do processo SFTP → SharePoint');

    const accessToken = await getAccessToken(
      process.env.SPO_CLIENT_ID,
      process.env.SPO_CLIENT_SECRET,
      process.env.SPO_TENANT_ID
    );

    const siteId = await getSiteId(accessToken, process.env.SPO_SITE_URL);
    const driveId = await getDriveId(accessToken, siteId, process.env.SPO_DOC_LIB);

    await processLatestFiles(sftpConfig, remoteDir, async (readStream, fileName) => {
      await uploadFileStream(accessToken, siteId, driveId, sharePointFolder, readStream, fileName);
      logInfo(`Arquivo ${fileName} enviado com sucesso para SharePoint`);
    });

    logInfo('Processo concluído com sucesso');
    return { statusCode: 200, body: JSON.stringify({ message: 'Arquivos enviados com sucesso!' }) };

  } catch (err) {
    logError('Erro geral no processo SFTP → SharePoint', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

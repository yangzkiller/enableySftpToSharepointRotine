import Client from 'ssh2-sftp-client';
import path from 'path';
import { logInfo, logError } from './logger.mjs';

const FILES_TO_DOWNLOAD = [
  'cejam_learners_course_performance_cejam.csv',
  'cejam_learners_course_rating_cejam.csv',
  'cejam_user_base_cejam.csv'
];

export async function connectSFTP(sftpConfig) {
  const sftp = new Client();
  try {
    logInfo('Conectando ao SFTP');
    await sftp.connect(sftpConfig);
    logInfo('Conexão SFTP estabelecida com sucesso');
    return sftp;
  } catch (err) {
    logError('Erro ao conectar ao SFTP', err);
    throw err;
  }
}

export async function processLatestFiles(sftpConfig, remoteDir, callbackPerFile) {
  const sftp = await connectSFTP(sftpConfig);

  try {
    let folders = await sftp.list(remoteDir);
    folders = folders.filter(f => f.type === 'd');
    if (!folders.length) throw new Error('Nenhuma pasta encontrada no diretório remoto');

    folders.sort((a, b) => new Date(b.name) - new Date(a.name));
    const latestFolder = folders[0].name;
    logInfo(`Pasta mais recente encontrada: ${latestFolder}`);

    const remotePath = path.posix.join(remoteDir, latestFolder);

    for (const fileName of FILES_TO_DOWNLOAD) {
      const remoteFile = path.posix.join(remotePath, fileName);
      logInfo(`Processando arquivo SFTP: ${remoteFile}`);
      
      const fileStream = await sftp.get(remoteFile);
      await callbackPerFile(fileStream, fileName);
      logInfo(`Arquivo ${fileName} processado com sucesso`);
    }
  } catch (err) {
    logError('Erro ao processar arquivos SFTP', err);
    throw err;
  } finally {
    await sftp.end();
  }
}

import { readdir } from 'fs-extra';
import { dirname, resolve } from 'path';
import FileSystem from 'mock-fs/lib/filesystem';
import mock from 'mock-fs';

let basedir = '';

export const generateMockLoadFor = async (path: string) => {
  const fsystem: FileSystem.DirectoryItem = {};
  let wildcardCheck = '';
  // allow wildcards
  if (path.includes('*')) {
    wildcardCheck = path.match(/.*[^\/]\/(.*)\*$/)![1]; // dangerously get path
    path = dirname(path);
  }

  for (const file of await readdir(path)) {
    if (wildcardCheck && !file.startsWith(wildcardCheck)) {
      continue;
    }

    const filepath = resolve(path, file);
    fsystem[filepath] = mock.load(filepath);
  }

  return fsystem;
};

/**
 * Mockfs file system but keeps project folder and jest temporal folder
 */
const mockfs = async (config?: FileSystem.DirectoryItem | undefined) => {
  mock({
    ...(basedir ? await generateMockLoadFor(basedir) : {}),
    ...(await generateMockLoadFor('/tmp/jest*')),
    ...(<object>config),
  });

  return (callback?: Function) => {
    mock.restore();
    callback && callback();
  };
};

export const setBasedir = (path = '') => {
  basedir = path ? resolve(path) : '';
};

export default mockfs;

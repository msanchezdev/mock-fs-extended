import { readdir } from 'fs-extra';
import { dirname, resolve } from 'path';
import FileSystem from 'mock-fs/lib/filesystem';
import mock from 'mock-fs';

let basedir = '';

const generateMockLoadFor = async (path: string) => {
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
    try {
      fsystem[filepath] = mock.load(filepath);
    } catch {
      // ignore fs errors (symlinks can fail if the linked entity doesnt exist)
    }
  }

  return fsystem;
};

/**
 * Mockfs file system but keeps project folder and jest temporal folder
 */
export const mockfs = async (config?: FileSystem.DirectoryItem | undefined) => {
  mock({
    ...(basedir ? await generateMockLoadFor(basedir) : {}),
    ...(await generateMockLoadFor('/tmp/jest*')),
    ...(await generateMockLoadFor('/tmp/ts-node*')),
    ...(await generateMockLoadFor('/tmp/node*')),
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

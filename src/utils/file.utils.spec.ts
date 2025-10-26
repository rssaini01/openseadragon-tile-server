jest.mock('fs');
jest.mock('path');
jest.mock('util', () => ({
  promisify: (fn: any) => fn,
}));

import * as fs from 'fs';
import * as path from 'path';

import {
  ensureDir,
  deleteFile,
  deleteDirectory,
  getFileExtension,
  generateImageId,
} from './file.utils';

describe('file.utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('ensureDir', () => {
    it('creates directory if not exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const mkdir = jest.spyOn(fs, 'mkdir').mockImplementation((_p: any, _opts: any) => Promise.resolve());
      await ensureDir('/dir');
      expect(mkdir).toHaveBeenCalledWith('/dir', { recursive: true });
    });

    it('does nothing if directory exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mkdir = jest.spyOn(fs, 'mkdir');
      await ensureDir('/dir');
      expect(mkdir).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('deletes file if exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const unlink = jest.spyOn(fs, 'unlink').mockImplementation((_p: any) => Promise.resolve());
      await deleteFile('/file.txt');
      expect(unlink).toHaveBeenCalledWith('/file.txt');
    });

    it('does nothing if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const unlink = jest.spyOn(fs, 'unlink');
      await deleteFile('/file.txt');
      expect(unlink).not.toHaveBeenCalled();
    });
  });

  describe('deleteDirectory', () => {
    it('does nothing if directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await deleteDirectory('/empty');
      expect(fs.existsSync).toHaveBeenCalledWith('/empty');
    });
  });

  describe('getFileExtension', () => {
    it('returns lowercase extension', () => {
      (path.extname as jest.Mock).mockReturnValue('.JPG');
      expect(getFileExtension('b.JPG')).toBe('jpg');
    });

    it('returns empty string if none', () => {
      (path.extname as jest.Mock).mockReturnValue('');
      expect(getFileExtension('nofile')).toBe('');
    });
  });

  describe('generateImageId', () => {
    it('strips extension from basename', () => {
      (path.extname as jest.Mock).mockReturnValue('.png');
      (path.basename as jest.Mock).mockReturnValue('abc');
      expect(generateImageId('x.png')).toBe('abc');
    });
  });
});

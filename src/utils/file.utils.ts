import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rmdir = promisify(fs.rmdir);

export const ensureDir = async (dirPath: string): Promise<void> => {
    if (!fs.existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
    }
};

export const deleteFile = async (filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) {
        await unlink(filePath);
    }
};

export const deleteDirectory = async (dirPath: string): Promise<void> => {
    if (!fs.existsSync(dirPath)) return;

    const files = await readdir(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
            await deleteDirectory(filePath);
        } else {
            await unlink(filePath);
        }
    }

    await rmdir(dirPath);
};

export const getFileExtension = (filename: string): string => {
    return path.extname(filename).toLowerCase().replace('.', '');
};

export const generateImageId = (filename: string): string => {
    const ext = path.extname(filename);
    return path.basename(filename, ext);
};

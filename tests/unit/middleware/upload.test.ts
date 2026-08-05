import upload, { uploadLocal } from '../../../src/middleware/upload';

describe('upload middleware', () => {
  it('exports a configured multer instance', () => {
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.array).toBe('function');
    expect(uploadLocal).toBeDefined();
    expect(typeof uploadLocal.single).toBe('function');
  });

  it('enforces a 5MB file size limit', () => {
    const limits: any = (upload as any).limits;
    expect(limits.fileSize).toBe(5 * 1024 * 1024);
  });
});

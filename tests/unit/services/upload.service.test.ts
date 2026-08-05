// UploadService unit tests — cloudinary mocked

vi.mock('../../../src/config/cloudinary', () => ({
  uploadToCloudinary: vi.fn(),
  isConfigured: false,
}));

import UploadService from '../../../src/services/upload.service';

const mockFile = {
  originalname: 'image.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('data'),
} as Express.Multer.File;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UploadService', () => {
  describe('uploadFile', () => {
    it('throws 400 when no file', async () => {
      await expect(UploadService.uploadFile(null as any)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('returns file metadata when cloudinary not configured', async () => {
      const result = await UploadService.uploadFile(mockFile);
      expect(result.filename).toBe('image.jpg');
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.size).toBe(1024);
      expect(result.note).toBeDefined();
    });
  });

  describe('uploadMultiple', () => {
    it('throws 400 when no files', async () => {
      await expect(UploadService.uploadMultiple([])).rejects.toMatchObject({ statusCode: 400 });
    });

    it('uploads multiple files', async () => {
      const result = await UploadService.uploadMultiple([mockFile, mockFile]);
      expect(result).toHaveLength(2);
    });
  });
});

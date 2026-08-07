// UploadService unit tests — cloudinary mocked

vi.mock('../../../src/config/cloudinary', () => ({
  uploadToCloudinary: vi.fn(),
  isConfigured: false,
}));

import UploadService from '../../../src/services/upload.service';
import * as cloudinary from '../../../src/config/cloudinary';

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

    it('throws 503 when cloudinary not configured', async () => {
      await expect(UploadService.uploadFile(mockFile)).rejects.toMatchObject({ statusCode: 503 });
    });

    it('uploads via cloudinary when configured and returns metadata', async () => {
      (cloudinary.isConfigured as any) = true;
      (cloudinary.uploadToCloudinary as any).mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image.jpg',
        publicId: 'renthub/abc123',
      });
      const result = await UploadService.uploadFile(mockFile);
      expect(result.filename).toBe('image.jpg');
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.size).toBe(1024);
      expect(result.url).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(cloudinary.uploadToCloudinary).toHaveBeenCalled();
    });
  });

  describe('uploadMultiple', () => {
    it('throws 400 when no files', async () => {
      await expect(UploadService.uploadMultiple([])).rejects.toMatchObject({ statusCode: 400 });
    });

    it('uploads multiple files when cloudinary configured', async () => {
      (cloudinary.isConfigured as any) = true;
      (cloudinary.uploadToCloudinary as any).mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image.jpg',
        publicId: 'renthub/abc123',
      });
      const result = await UploadService.uploadMultiple([mockFile, mockFile]);
      expect(result).toHaveLength(2);
    });
  });
});

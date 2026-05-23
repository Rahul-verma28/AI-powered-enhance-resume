import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Cloudinary Storage Service.
 * Handles upload/download of PDFs and resume files.
 */
export class CloudinaryService {
  /**
   * Upload a file buffer to Cloudinary.
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      fileName: string;
      resourceType?: 'raw' | 'image' | 'auto';
    }
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `resumeai/${options.folder}`,
          public_id: options.fileName,
          resource_type: options.resourceType || 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload a file from a URL.
   */
  async uploadFromUrl(
    url: string,
    folder: string,
    fileName: string
  ): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(url, {
      folder: `resumeai/${folder}`,
      public_id: fileName,
      resource_type: 'raw',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  /**
   * Delete a file from Cloudinary.
   */
  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

  /**
   * Get a signed URL for a private file.
   */
  getSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });
  }
}

export const cloudinaryService = new CloudinaryService();

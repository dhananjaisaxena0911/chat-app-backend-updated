import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('S3_REGION') || 'ap-southeast-1';
    this.bucket = this.configService.get<string>('S3_BUCKET') || '';
    
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // Get the endpoint base URL (without bucket path if already included)
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    
    // Check if endpoint already contains bucket name
    const bucketInEndpoint = endpoint.includes(`/${this.bucket}/`) || endpoint.endsWith(`/${this.bucket}`);
    
    if (bucketInEndpoint) {
      // Endpoint already has bucket, just append the key
      return `${endpoint}/${fileName}`;
    } else {
      // Need to add bucket to endpoint
      return `${endpoint}/${this.bucket}/${fileName}`;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUploadUrl(
    fileName: string,
    folder: string = 'uploads',
    contentType: string = 'image/*',
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    
    // Get the endpoint base URL (without bucket path if already included)
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    
    // Check if endpoint already contains bucket name
    const bucketInEndpoint = endpoint.includes(`/${this.bucket}/`) || endpoint.endsWith(`/${this.bucket}`);
    
    let fileUrl: string;
    if (bucketInEndpoint) {
      fileUrl = `${endpoint}/${key}`;
    } else {
      fileUrl = `${endpoint}/${this.bucket}/${key}`;
    }

    return { uploadUrl, fileUrl };
  }

  async getSignedDownloadUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Decode URL if it's double-encoded (e.g., %2520 -> %20 -> space)
      let decodedUrl = decodeURIComponent(fileUrl);
      
      // Validate URL format before processing
      if (!this.isValidUrl(decodedUrl)) {
        console.error('Invalid URL format:', decodedUrl);
        return fileUrl;
      }

      const url = new URL(decodedUrl);
      
      // Extract the key from the URL pathname
      // The URL format is: https://host.com/bucket/folder/filename
      // We need just the folder/filename part as the key
      let key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      
      // Remove leading bucket name and any duplicate paths
      // For URLs like: SocialDev/s3/SocialDev/s3/SocialDev/blogs/file.png
      // The actual key should be: blogs/file.png
      const pathnameParts = key.split('/');
      
      // Find the folder name (like "blogs") and use everything after it
      const folderIndex = pathnameParts.findIndex(part => 
        part === 'blogs' || part === 'stories' || part === 'uploads' || part === 'avatars'
      );
      
      if (folderIndex >= 0) {
        // Use everything from the folder onwards
        key = pathnameParts.slice(folderIndex).join('/');
      } else {
        // Fallback: use the last 2 parts as the key
        key = pathnameParts.slice(-2).join('/');
      }
      
      // Decode percent-encoded characters to get the actual key (e.g., %20 -> space)
      // This is crucial because S3 stores files with actual spaces, not encoded
      key = decodeURIComponent(key);
      
      console.log('Extracted S3 key:', key);
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed download URL:', error);
      // Return original URL as fallback
      return fileUrl;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      // Check if it starts with http:// or https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}


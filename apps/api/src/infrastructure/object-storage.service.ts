import { Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class ObjectStorageService {
  private readonly bucket = process.env.RUMPTY_S3_BUCKET;
  private readonly client =
    this.bucket && process.env.RUMPTY_S3_ENDPOINT
      ? new S3Client({
          endpoint: process.env.RUMPTY_S3_ENDPOINT,
          region: process.env.RUMPTY_S3_REGION || "auto",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.RUMPTY_S3_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.RUMPTY_S3_SECRET_ACCESS_KEY || "",
          },
        })
      : null;

  get configured() {
    return this.client !== null;
  }

  async putPrivateObject(key: string, body: Uint8Array, contentType: string) {
    if (!this.client || !this.bucket) {
      throw new Error("Rumpty object storage is not configured");
    }
    if (key.startsWith("/") || key.split("/").includes("..")) {
      throw new Error("Object key must be a relative path");
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
}

// lib/image/compress.ts
import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fileType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    fileType = "image/webp",
  } = options;

  // Skip if already small and WebP
  if (file.size < 300 * 1024 && file.type === "image/webp") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      fileType,
      initialQuality: quality,
      preserveExif: false,
    });

    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressed], newName, { type: fileType });
  } catch (err) {
    console.error("Compression failed, uploading original:", err);
    return file;
  }
}
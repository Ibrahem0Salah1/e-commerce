//components/admin/ProductImageUploader.tsx
"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileRejection, useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Trash2, ImagePlus } from "lucide-react";
import { CircularProgress } from "../shared/CircularProgress"; // your existing component
import { compressImage } from "@/lib/utils/compress";
import { computeFileHash } from "@/lib/utils/hash";
interface ProductImageUploaderProps {
  value: string[]; // R2 public URLs currently in the form
  onChange: (urls: string[]) => void; // emit new array to form
  maxFiles?: number;
}

export function ProductImageUploader({
  value = [],
  onChange,
  maxFiles = 5,
}: ProductImageUploaderProps) {
  const [uploads, setUploads] = useState<
    Array<{
      id: string;
      file: File;
      objectUrl: string;
      progress: number;
      uploading: boolean;
      error: boolean;
      url?: string; // final R2 public URL
      key?: string; // R2 object key (for deletion)
      persisted: boolean; // already stored & referenced by a saved product
    }>
  >([]);

  // Seed initial value (pre-existing URLs from DB) exactly once on mount.
  // Using a ref prevents duplicate thumbnails when onChange fires and
  // the parent re-renders with a new `value` array reference.
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current || !value.length) return;
    initialised.current = true;

    setUploads(
      value.map((url) => ({
        id: uuidv4(),
        file: new File([], "existing"),
        objectUrl: url,
        progress: 100,
        uploading: false,
        error: false,
        url,
        key: url.split("/").pop(),
        persisted: true,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploads.forEach((u) => {
        if (u.objectUrl && !u.url) URL.revokeObjectURL(u.objectUrl);
      });
    };
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const id = uuidv4();
    const objectUrl = URL.createObjectURL(file);

    setUploads((prev) => [
      ...prev,
      {
        id,
        file,
        objectUrl,
        progress: 0,
        uploading: true,
        error: false,
        persisted: false,
      },
    ]);

    try {
      console.log(`[UploadFlow] 🚀 Calculating SHA-256 hash for: ${file.name}`);
      const fileHash = await computeFileHash(file);
      console.log(`[UploadFlow] 🔑 File hash: ${fileHash}`);

      // 1. Get presigned URL or check if file exists on server
      const res = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          fileHash,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { exists, presignedUrl, key, publicUrl } = await res.json();

      if (exists) {
        // Instant reuse — skip PUT upload!
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, progress: 100, uploading: false, url: publicUrl, key }
              : u
          )
        );
        toast.success(`${file.name} (reused from storage)`);
        console.log(`[UploadFlow] ⚡ Existing image matched in R2 bucket! Reusing URL: ${publicUrl}`);
        return publicUrl;
      }

      // 2. Upload directly to R2 via XMLHttpRequest (for progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // 3. Success — update local state
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, progress: 100, uploading: false, url: publicUrl, key }
            : u
        )
      );

      toast.success(`${file.name} uploaded`);
      console.log(`[UploadFlow] ✅ Successfully uploaded: ${file.name} -> ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, uploading: false, error: true } : u))
      );
      console.error(`[UploadFlow] ❌ Failed uploading ${file.name}:`, err);
      return null;
    }
  };

  const removeFile = async (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (!upload) return;

    if (!upload.persisted && upload.key && !upload.uploading) {
      try {
        const res = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: upload.key }),
        });
        console.log(upload.url)
        if (!res.ok) throw new Error("Failed to delete from storage");
      } catch (err) {
        console.log(err);
        return;
      }
    }

    // Cleanup object URL if it's a local preview
    if (upload.objectUrl && !upload.url) {
      URL.revokeObjectURL(upload.objectUrl);
    }

    // Remove from local state
    setUploads((prev) => prev.filter((u) => u.id !== id));

    // Emit updated array to parent (remove this URL)
    if (upload.url) {
      const remaining = value.filter((v) => v !== upload.url);
      console.log(`[UploadFlow] 🗑️ Removed image ${upload.url}. Emitting remaining URLs:`, remaining);
      onChange(remaining);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - uploads.length;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (acceptedFiles.length > remainingSlots) {
        toast.error(`Max ${maxFiles} images allowed`);
      }

      console.log(
        `[UploadFlow] 📥 onDrop triggered with ${acceptedFiles.length} file(s). Processing ${filesToProcess.length} file(s). Current form values count: ${value.length}`
      );

      // Compress all files in parallel before uploading
      const compressedFiles = await Promise.all(
        filesToProcess.map((file) => compressImage(file))
      );

      compressedFiles.forEach((file) => {
        toast.info(`${file.name} — ${(file.size / 1024).toFixed(0)}KB`);
      });

      // Upload all compressed files in parallel and collect returned URLs
      const results = await Promise.all(
        compressedFiles.map((file) => uploadFile(file))
      );

      const successfulUrls = results.filter(
        (url): url is string => url !== null
      );

      console.log(
        `[UploadFlow] 📦 All batch uploads finished. ${successfulUrls.length} image(s) uploaded successfully:`,
        successfulUrls
      );

      if (successfulUrls.length > 0) {
        const updatedUrls = [...value, ...successfulUrls];
        console.log(
          `[UploadFlow] 📤 Emitting full updated URLs array to form (${updatedUrls.length} total):`,
          updatedUrls
        );
        onChange(updatedUrls);
      }
    },
    [uploads.length, maxFiles, value, onChange]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach((r) => {
      const code = r.errors[0].code;
      if (code === "too-many-files") toast.error("Too many files");
      if (code === "file-too-large") toast.error("File too large (max 10MB)");
      if (code === "file-invalid-type") toast.error("Only images allowed");
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: maxFiles - uploads.length,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: { "image/*": [] },
    disabled: uploads.length >= maxFiles,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {uploads.length < maxFiles && (
        <Card
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed transition-colors cursor-pointer h-48",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <CardContent className="flex flex-col items-center justify-center h-full gap-2">
            <input {...getInputProps()} />
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {isDragActive
                ? "Drop images here..."
                : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to 10MB
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview Grid */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
              <img
                src={upload.objectUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
              />

              {/* Uploading overlay */}
              {upload.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <CircularProgress progress={upload.progress} />
                </div>
              )}

              {/* Error overlay */}
              {upload.error && (
                <div className="absolute inset-0 bg-destructive/60 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Failed</span>
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeFile(upload.id)}
                disabled={upload.uploading}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {uploads.length} / {maxFiles} images
      </p>
    </div>
  );
}
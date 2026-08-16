"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "../shared/CircularProgress";
import { compressImage } from "@/lib/utils/compress";
import { computeFileHash } from "@/lib/utils/hash";

type UploadEntry = {
  id: string;
  file: File;
  objectUrl: string;
  progress: number;
  uploading: boolean;
  error: boolean;
  url?: string;
  key?: string;
  persisted: boolean;
};

interface ImageUploaderProps {
  value: string | null; // R2 public URL currently in the form
  onChange: (url: string | null) => void; // emit the new URL (null = removed)
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [entry, setEntry] = useState<UploadEntry | null>(null);

  const createdObjectUrlsRef = useRef<string[]>([]);

  // Seed the existing DB URL exactly once on mount.
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current || !value) return;
    initialised.current = true;

    setEntry({
      id: uuidv4(),
      file: new File([], "existing"),
      objectUrl: value,
      progress: 100,
      uploading: false,
      error: false,
      url: value,
      key: value.split("/").pop(),
      persisted: true,
    });
  }, []); // intentionally empty — runs once on mount only

  // Cleanup local preview object URLs on unmount
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const id = uuidv4();
    const objectUrl = URL.createObjectURL(file);
    createdObjectUrlsRef.current.push(objectUrl);

    setEntry({
      id,
      file,
      objectUrl,
      progress: 0,
      uploading: true,
      error: false,
      persisted: false,
    });

    try {
      const fileHash = await computeFileHash(file);

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
        setEntry((prev) =>
          prev?.id === id
            ? { ...prev, progress: 100, uploading: false, url: publicUrl, key }
            : prev,
        );
        toast.success(`${file.name} (reused from storage)`);
        return publicUrl;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setEntry((prev) =>
              prev?.id === id ? { ...prev, progress: pct } : prev,
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

      setEntry((prev) =>
        prev?.id === id
          ? { ...prev, progress: 100, uploading: false, url: publicUrl, key }
          : prev,
      );

      toast.success(`${file.name} uploaded`);
      return publicUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setEntry((prev) =>
        prev?.id === id ? { ...prev, uploading: false, error: true } : prev,
      );
      return null;
    }
  };

  const remove = async () => {
    if (!entry) return;

    if (!entry.persisted && entry.key && !entry.uploading) {
      try {
        const res = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: entry.key }),
        });
        if (!res.ok) throw new Error("Failed to delete from storage");
      } catch (err) {
        console.log(err);
        return;
      }
    }

    if (entry.objectUrl && !entry.url) {
      URL.revokeObjectURL(entry.objectUrl);
    }

    setEntry(null);
    onChange(null);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (entry) return;

      const file = acceptedFiles[0];
      if (!file) return;

      const compressed = await compressImage(file);
      toast.info(`${compressed.name} — ${(compressed.size / 1024).toFixed(0)}KB`);

      const url = await uploadFile(compressed);
      if (url) onChange(url);
    },
    [entry, onChange],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach((r) => {
      const code = r.errors[0].code;
      if (code === "too-many-files") toast.error("Only one image allowed");
      if (code === "file-too-large") toast.error("File too large (max 10MB)");
      if (code === "file-invalid-type") toast.error("Only images allowed");
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: { "image/*": [] },
    disabled: !!entry,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!entry && (
        <Card
          {...getRootProps()}
          className={cn(
            "relative h-40 border-2 border-dashed transition-colors cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
          )}
        >
          <CardContent className="flex h-full flex-col items-center justify-center gap-2">
            <input {...getInputProps()} />
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {isDragActive
                ? "Drop image here..."
                : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to 10MB
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {entry && (
        <div className="group relative aspect-square max-w-56 overflow-hidden rounded-lg border bg-muted">
          <img
            src={entry.objectUrl}
            alt="Image preview"
            className="h-full w-full object-cover"
          />

          {entry.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <CircularProgress progress={entry.progress} />
            </div>
          )}

          {entry.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/60">
              <span className="text-xs font-medium text-white">Failed</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void remove()}
            disabled={entry.uploading}
            aria-label="Remove image"
            className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {entry ? 1 : 0} / 1 image
      </p>
    </div>
  );
}

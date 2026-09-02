"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useRequestItemImageUpload,
  useDeleteItemImage,
} from "@/hooks/use-item-images";
import {
  IMAGE_CONTENT_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "@/lib/validations/upload";
import type { ItemImageDTO } from "@/server/actions/items";

const MAX_IMAGES = 8;

type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

function isSupportedImageType(type: string): type is ImageContentType {
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(type);
}

export function ItemImageUploader({
  images,
  onChange,
}: {
  images: ItemImageDTO[];
  onChange: (images: ItemImageDTO[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const requestUpload = useRequestItemImageUpload();
  const deleteImage = useDeleteItemImage();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    const selected = Array.from(files).slice(0, Math.max(0, remaining));
    let nextImages = images;

    for (const file of selected) {
      if (!isSupportedImageType(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        toast.error(`${file.name}: too large (max 5 MB)`);
        continue;
      }

      setUploadingCount((c) => c + 1);
      try {
        const { uploadUrl, key, publicUrl, contentType } =
          await requestUpload.mutateAsync({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          });

        const putResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!putResponse.ok) {
          throw new Error(`Upload failed (${putResponse.status})`);
        }

        nextImages = [...nextImages, { key, url: publicUrl }];
        onChange(nextImages);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  };

  const handleRemove = (key: string) => {
    onChange(images.filter((img) => img.key !== key));
    deleteImage.mutate(
      { key },
      {
        onError: () =>
          toast.error(
            "Couldn't delete the image from storage (it was removed here anyway).",
          ),
      },
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image) => (
        <div
          key={image.key}
          className="group relative size-16 shrink-0 overflow-hidden rounded-lg border"
        >
          <Image
            src={image.url}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => handleRemove(image.key)}
            className="absolute top-0.5 end-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Remove image"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingCount > 0}
          className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
        >
          {uploadingCount > 0 ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-4" />
          )}
          <span className="text-[10px]">Add</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONTENT_TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

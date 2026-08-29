"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useRequestOfferBannerUpload,
  useDeleteOfferBannerImage,
} from "@/hooks/use-offer-banner-upload";
import {
  IMAGE_CONTENT_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "@/lib/validations/upload";
import type { OfferBannerImageDTO } from "@/server/actions/offers";

type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

function isSupportedImageType(type: string): type is ImageContentType {
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(type);
}

/** Single-image uploader for one banner slot (mobile or desktop). */
export function OfferBannerUploader({
  label,
  hint,
  image,
  onChange,
  aspectClassName = "aspect-video",
}: {
  label: string;
  hint: string;
  image: OfferBannerImageDTO | null;
  onChange: (image: OfferBannerImageDTO | null) => void;
  /** Tailwind aspect-ratio class for the preview/drop box, e.g. "aspect-3/1". */
  aspectClassName?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const requestUpload = useRequestOfferBannerUpload();
  const deleteImage = useDeleteOfferBannerImage();

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!isSupportedImageType(file.type)) {
      toast.error(`${file.name}: unsupported file type`);
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      toast.error(`${file.name}: too large (max 5 MB)`);
      return;
    }

    const previousKey = image?.key ?? null;
    setIsUploading(true);
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

      onChange({ key, url: publicUrl });
      if (previousKey) {
        deleteImage.mutate({ key: previousKey });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (!image) return;
    onChange(null);
    deleteImage.mutate(
      { key: image.key },
      {
        onError: () =>
          toast.error(
            "Couldn't delete the image from storage (it was removed here anyway).",
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground grow">{hint}</div>
      {image ? (
        <div
          className={`group relative ${aspectClassName} w-full overflow-hidden rounded-lg border`}
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
            onClick={handleRemove}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`flex ${aspectClassName} w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-50`}
        >
          {isUploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-4" />
          )}
          <span className="text-xs">Upload image</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONTENT_TYPES.join(",")}
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

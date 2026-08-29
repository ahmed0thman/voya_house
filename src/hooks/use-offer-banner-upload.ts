"use client";

import { useMutation } from "@tanstack/react-query";
import {
  requestOfferBannerUpload,
  deleteOfferBannerImage,
} from "@/server/actions/uploads";
import { unwrap } from "@/lib/action-result";
import type {
  RequestOfferBannerUploadInput,
  DeleteOfferBannerImageInput,
} from "@/lib/validations/upload";

export function useRequestOfferBannerUpload() {
  return useMutation({
    mutationFn: (input: RequestOfferBannerUploadInput) =>
      unwrap(requestOfferBannerUpload(input)),
  });
}

export function useDeleteOfferBannerImage() {
  return useMutation({
    mutationFn: (input: DeleteOfferBannerImageInput) =>
      unwrap(deleteOfferBannerImage(input)),
  });
}

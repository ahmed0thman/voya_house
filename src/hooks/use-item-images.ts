"use client";

import { useMutation } from "@tanstack/react-query";
import {
  requestItemImageUpload,
  deleteItemImage,
} from "@/server/actions/uploads";
import { unwrap } from "@/lib/action-result";
import type {
  RequestItemImageUploadInput,
  DeleteItemImageInput,
} from "@/lib/validations/upload";

export function useRequestItemImageUpload() {
  return useMutation({
    mutationFn: (input: RequestItemImageUploadInput) => unwrap(requestItemImageUpload(input)),
  });
}

export function useDeleteItemImage() {
  return useMutation({
    mutationFn: (input: DeleteItemImageInput) => unwrap(deleteItemImage(input)),
  });
}

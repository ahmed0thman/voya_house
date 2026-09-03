"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWhatsappOrderNumber, getAppSettings, updateAppSettings } from "@/server/actions/settings";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type { UpdateAppSettingsInput } from "@/lib/validations/settings";

/** Public: the number a guest's placed order gets handed off to on WhatsApp, if configured. */
export function useWhatsappOrderNumber() {
  return useQuery({
    queryKey: queryKeys.settings.whatsappOrderNumber,
    queryFn: () => unwrap(getWhatsappOrderNumber()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => unwrap(getAppSettings()),
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAppSettingsInput) => unwrap(updateAppSettings(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.whatsappOrderNumber });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listOffers, createOffer, updateOffer, deleteOffer } from "@/server/actions/offers";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  CreateOfferInput,
  UpdateOfferInput,
  DeleteOfferInput,
} from "@/lib/validations/offer";

export function useOffers() {
  return useQuery({
    queryKey: queryKeys.offers.all,
    queryFn: () => unwrap(listOffers()),
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => unwrap(createOffer(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOfferInput) => unwrap(updateOffer(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteOfferInput) => unwrap(deleteOffer(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

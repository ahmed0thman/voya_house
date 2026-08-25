"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listOffers, createOffer, updateOffer, deleteOffer } from "@/server/actions/offers";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateOfferInput,
  UpdateOfferInput,
  DeleteOfferInput,
} from "@/lib/validations/offer";

export function useOffers() {
  return useQuery({
    queryKey: queryKeys.offers.all,
    queryFn: () => listOffers(),
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => createOffer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOfferInput) => updateOffer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteOfferInput) => deleteOffer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getFeaturedOfferBanner,
} from "@/server/actions/offers";
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

/** Public: the offer banner shown atop the guest-facing menu, if one is featured. */
export function useFeaturedOfferBanner() {
  return useQuery({
    queryKey: queryKeys.offers.featuredBanner,
    queryFn: () => unwrap(getFeaturedOfferBanner()),
    staleTime: 60 * 1000,
  });
}

function invalidateOfferQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.offers.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.offers.featuredBanner });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => unwrap(createOffer(input)),
    onSuccess: () => invalidateOfferQueries(queryClient),
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOfferInput) => unwrap(updateOffer(input)),
    onSuccess: () => invalidateOfferQueries(queryClient),
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteOfferInput) => unwrap(deleteOffer(input)),
    onSuccess: () => invalidateOfferQueries(queryClient),
  });
}

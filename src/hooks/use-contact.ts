"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveContactSubjects,
  listContactSubjects,
  createContactSubject,
  updateContactSubject,
  deleteContactSubject,
  reorderContactSubjects,
  submitContactMessage,
  listContactMessages,
} from "@/server/actions/contact";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  CreateContactSubjectInput,
  UpdateContactSubjectInput,
  DeleteContactSubjectInput,
  ReorderContactSubjectsInput,
  SubmitContactMessageInput,
  ListContactMessagesInput,
} from "@/lib/validations/contact";

/** Public: the active subjects shown as topic chips on the landing page's contact form. */
export function useActiveContactSubjects() {
  return useQuery({
    queryKey: queryKeys.contact.activeSubjects,
    queryFn: () => unwrap(getActiveContactSubjects()),
    staleTime: 60 * 1000,
  });
}

export function useContactSubjects() {
  return useQuery({
    queryKey: queryKeys.contact.subjects,
    queryFn: () => unwrap(listContactSubjects()),
  });
}

function invalidateContactSubjectQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.contact.subjects });
  queryClient.invalidateQueries({ queryKey: queryKeys.contact.activeSubjects });
}

export function useCreateContactSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContactSubjectInput) => unwrap(createContactSubject(input)),
    onSuccess: () => invalidateContactSubjectQueries(queryClient),
  });
}

export function useUpdateContactSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateContactSubjectInput) => unwrap(updateContactSubject(input)),
    onSuccess: () => invalidateContactSubjectQueries(queryClient),
  });
}

export function useDeleteContactSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteContactSubjectInput) => unwrap(deleteContactSubject(input)),
    onSuccess: () => invalidateContactSubjectQueries(queryClient),
  });
}

export function useReorderContactSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderContactSubjectsInput) => unwrap(reorderContactSubjects(input)),
    onSuccess: () => invalidateContactSubjectQueries(queryClient),
  });
}

/** Public: submits the landing page's contact form. */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (input: SubmitContactMessageInput) => unwrap(submitContactMessage(input)),
  });
}

export function useContactMessages(filters: ListContactMessagesInput) {
  return useQuery({
    queryKey: queryKeys.contact.messages(JSON.stringify(filters)),
    queryFn: () => unwrap(listContactMessages(filters)),
    placeholderData: (previous) => previous,
  });
}

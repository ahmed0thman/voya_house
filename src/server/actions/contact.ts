"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { defineAction } from "@/server/define-action";
import {
  createContactSubjectSchema,
  updateContactSubjectSchema,
  deleteContactSubjectSchema,
  reorderContactSubjectsSchema,
  submitContactMessageSchema,
  listContactMessagesSchema,
} from "@/lib/validations/contact";

export type ContactSubjectDTO = {
  id: string;
  label: string;
  labelAr: string | null;
  isActive: boolean;
  sortOrder: number;
};

function toContactSubjectDTO(subject: {
  id: string;
  label: string;
  labelAr: string | null;
  isActive: boolean;
  sortOrder: number;
}): ContactSubjectDTO {
  return {
    id: subject.id,
    label: subject.label,
    labelAr: subject.labelAr,
    isActive: subject.isActive,
    sortOrder: subject.sortOrder,
  };
}

export type ActiveContactSubjectDTO = {
  id: string;
  label: string;
  labelAr: string | null;
};

/**
 * Public on purpose — feeds the topic chips on the landing page's contact
 * form, browsed by guests who aren't signed in.
 */
export const getActiveContactSubjects = defineAction({
  auth: "public",
  handler: async (): Promise<ActiveContactSubjectDTO[]> => {
    const subjects = await prisma.contactSubject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true, labelAr: true },
    });
    return subjects;
  },
});

export const listContactSubjects = defineAction({
  auth: "admin",
  handler: async (): Promise<ContactSubjectDTO[]> => {
    const subjects = await prisma.contactSubject.findMany({ orderBy: { sortOrder: "asc" } });
    return subjects.map(toContactSubjectDTO);
  },
});

export const createContactSubject = defineAction({
  auth: "admin",
  schema: createContactSubjectSchema,
  handler: async (input): Promise<ContactSubjectDTO> => {
    const subject = await prisma.$transaction(async (tx) => {
      const last = await tx.contactSubject.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      return tx.contactSubject.create({
        data: {
          label: input.label,
          labelAr: input.labelAr || null,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      });
    });

    return toContactSubjectDTO(subject);
  },
});

export const updateContactSubject = defineAction({
  auth: "admin",
  schema: updateContactSubjectSchema,
  handler: async (input): Promise<ContactSubjectDTO> => {
    const existing = await prisma.contactSubject.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Subject not found.", "NOT_FOUND");

    const subject = await prisma.contactSubject.update({
      where: { id: input.id },
      data: {
        label: input.label,
        labelAr: input.labelAr === undefined ? undefined : input.labelAr || null,
        isActive: input.isActive,
      },
    });

    return toContactSubjectDTO(subject);
  },
});

export const deleteContactSubject = defineAction({
  auth: "admin",
  schema: deleteContactSubjectSchema,
  handler: async (input): Promise<{ id: string }> => {
    const existing = await prisma.contactSubject.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Subject not found.", "NOT_FOUND");

    await prisma.contactSubject.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

export const reorderContactSubjects = defineAction({
  auth: "admin",
  schema: reorderContactSubjectsSchema,
  handler: async (input): Promise<{ orderedIds: string[] }> => {
    const subjects = await prisma.contactSubject.findMany({ select: { id: true } });
    const knownIds = new Set(subjects.map((s) => s.id));
    const validOrderedIds = input.orderedIds.filter((id) => knownIds.has(id));

    if (validOrderedIds.length !== knownIds.size) {
      throw new ActionError(
        "Reorder list must include exactly the subjects that currently exist.",
        "VALIDATION",
      );
    }

    await prisma.$transaction(
      validOrderedIds.map((id, index) =>
        prisma.contactSubject.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );

    return { orderedIds: validOrderedIds };
  },
});

/**
 * Public on purpose — this is the landing page's contact form submitting.
 * A `subjectId` that doesn't resolve to an active subject anymore is treated
 * as "no subject" rather than a hard failure, same tolerance
 * `findActiveOfferByCode` applies to a stale offer code.
 */
export const submitContactMessage = defineAction({
  auth: "public",
  schema: submitContactMessageSchema,
  handler: async (input): Promise<{ id: string }> => {
    const subject = input.subjectId
      ? await prisma.contactSubject.findUnique({ where: { id: input.subjectId } })
      : null;

    const message = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        message: input.message,
        subjectId: subject?.id ?? null,
        subjectLabel: subject?.label ?? null,
        subjectLabelAr: subject?.labelAr ?? null,
      },
    });

    return { id: message.id };
  },
});

export type ContactMessageRowDTO = {
  id: string;
  name: string;
  email: string;
  message: string;
  subjectLabel: string | null;
  subjectLabelAr: string | null;
  createdAt: string;
};

export type ContactMessagesDTO = {
  rows: ContactMessageRowDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const listContactMessages = defineAction({
  auth: "admin",
  schema: listContactMessagesSchema,
  handler: async (input): Promise<ContactMessagesDTO> => {
    const [total, messages] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    const rows: ContactMessageRowDTO[] = messages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      message: m.message,
      subjectLabel: m.subjectLabel,
      subjectLabelAr: m.subjectLabelAr,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      rows,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  },
});

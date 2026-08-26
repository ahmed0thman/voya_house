"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { defineAction } from "@/server/define-action";
import {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
  createTablesRangeSchema,
} from "@/lib/validations/table";

export type TableDTO = {
  id: string;
  number: number;
  label: string | null;
  isActive: boolean;
};

function toTableDTO(table: {
  id: string;
  number: number;
  label: string | null;
  isActive: boolean;
}): TableDTO {
  return { id: table.id, number: table.number, label: table.label, isActive: table.isActive };
}

export const listTables = defineAction({
  auth: "admin",
  handler: async (): Promise<TableDTO[]> => {
    const tables = await prisma.restaurantTable.findMany({ orderBy: { number: "asc" } });
    return tables.map(toTableDTO);
  },
});

export const createTable = defineAction({
  auth: "admin",
  schema: createTableSchema,
  handler: async (input): Promise<TableDTO> => {
  const existing = await prisma.restaurantTable.findUnique({
    where: { number: input.number },
  });
  if (existing) {
    throw new ActionError(`Table ${input.number} already exists.`, "CONFLICT");
  }

  const table = await prisma.restaurantTable.create({
    data: { number: input.number, label: input.label || null },
  });

  return toTableDTO(table);
  },
});

export type CreateTablesRangeResult = {
  created: TableDTO[];
  skipped: number[];
};

/** Creates every table number in [start, end] that doesn't already exist; existing numbers are skipped, not treated as an error. */
export const createTablesRange = defineAction({
  auth: "admin",
  schema: createTablesRangeSchema,
  handler: async (input): Promise<CreateTablesRangeResult> => {
  const numbers = Array.from(
    { length: input.end - input.start + 1 },
    (_, i) => input.start + i,
  );

  const existing = await prisma.restaurantTable.findMany({
    where: { number: { in: numbers } },
    select: { number: true },
  });
  const existingSet = new Set(existing.map((table) => table.number));

  const toCreate = numbers.filter((number) => !existingSet.has(number));

  const created = await prisma.$transaction(
    toCreate.map((number) => prisma.restaurantTable.create({ data: { number } })),
  );

  return {
    created: created.map(toTableDTO),
    skipped: numbers.filter((number) => existingSet.has(number)),
  };
  },
});

export const updateTable = defineAction({
  auth: "admin",
  schema: updateTableSchema,
  handler: async (input): Promise<TableDTO> => {
  const existing = await prisma.restaurantTable.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Table not found.", "NOT_FOUND");

  if (input.number !== existing.number) {
    const numberTaken = await prisma.restaurantTable.findUnique({
      where: { number: input.number },
    });
    if (numberTaken) {
      throw new ActionError(`Table ${input.number} already exists.`, "CONFLICT");
    }
  }

  const table = await prisma.restaurantTable.update({
    where: { id: input.id },
    data: { number: input.number, label: input.label || null, isActive: input.isActive },
  });

  return toTableDTO(table);
  },
});

export const deleteTable = defineAction({
  auth: "admin",
  schema: deleteTableSchema,
  handler: async (input): Promise<{ id: string }> => {
    const existing = await prisma.restaurantTable.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Table not found.", "NOT_FOUND");

    await prisma.restaurantTable.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

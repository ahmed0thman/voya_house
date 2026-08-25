"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/dal";
import {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
  createTablesRangeSchema,
  type CreateTableInput,
  type UpdateTableInput,
  type DeleteTableInput,
  type CreateTablesRangeInput,
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

export async function listTables(): Promise<TableDTO[]> {
  await requireAdmin();
  const tables = await prisma.restaurantTable.findMany({ orderBy: { number: "asc" } });
  return tables.map(toTableDTO);
}

export async function createTable(rawInput: CreateTableInput): Promise<TableDTO> {
  await requireAdmin();
  const input = createTableSchema.parse(rawInput);

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
}

export type CreateTablesRangeResult = {
  created: TableDTO[];
  skipped: number[];
};

/** Creates every table number in [start, end] that doesn't already exist; existing numbers are skipped, not treated as an error. */
export async function createTablesRange(
  rawInput: CreateTablesRangeInput,
): Promise<CreateTablesRangeResult> {
  await requireAdmin();
  const input = createTablesRangeSchema.parse(rawInput);

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
}

export async function updateTable(rawInput: UpdateTableInput): Promise<TableDTO> {
  await requireAdmin();
  const input = updateTableSchema.parse(rawInput);

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
}

export async function deleteTable(rawInput: DeleteTableInput): Promise<{ id: string }> {
  await requireAdmin();
  const input = deleteTableSchema.parse(rawInput);

  const existing = await prisma.restaurantTable.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Table not found.", "NOT_FOUND");

  await prisma.restaurantTable.delete({ where: { id: input.id } });
  return { id: input.id };
}

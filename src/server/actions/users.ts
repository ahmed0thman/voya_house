"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/dal";
import { hashPassword } from "@/lib/password";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type DeleteUserInput,
} from "@/lib/validations/user";

export type UserDTO = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
};

function toUserDTO(user: {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt: Date;
}): UserDTO {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role as UserDTO["role"],
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsers(): Promise<UserDTO[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map(toUserDTO);
}

export async function createUser(rawInput: CreateUserInput): Promise<UserDTO> {
  await requireAdmin();
  const input = createUserSchema.parse(rawInput);

  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existing) {
    throw new ActionError("That username is already taken.", "CONFLICT");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      role: input.role,
      passwordHash: hashPassword(input.password),
    },
  });

  return toUserDTO(user);
}

export async function updateUser(rawInput: UpdateUserInput): Promise<UserDTO> {
  await requireAdmin();
  const input = updateUserSchema.parse(rawInput);

  const existing = await prisma.user.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("User not found.", "NOT_FOUND");

  if (input.username !== existing.username) {
    const usernameTaken = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (usernameTaken) {
      throw new ActionError("That username is already taken.", "CONFLICT");
    }
  }

  const user = await prisma.user.update({
    where: { id: input.id },
    data: {
      name: input.name,
      username: input.username,
      role: input.role,
      ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
    },
  });

  return toUserDTO(user);
}

export async function deleteUser(rawInput: DeleteUserInput): Promise<{ id: string }> {
  await requireAdmin();
  const input = deleteUserSchema.parse(rawInput);

  const existing = await prisma.user.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("User not found.", "NOT_FOUND");

  await prisma.user.delete({ where: { id: input.id } });
  return { id: input.id };
}

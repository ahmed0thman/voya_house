"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { defineAction } from "@/server/define-action";
import { hashPassword } from "@/lib/password";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from "@/lib/validations/user";

export type UserDTO = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "STAFF";
  createdAt: string;
};

function toUserDTO(user: {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  createdAt: Date;
}): UserDTO {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role as UserDTO["role"],
    createdAt: user.createdAt.toISOString(),
  };
}

export const listUsers = defineAction({
  auth: "admin",
  handler: async (): Promise<UserDTO[]> => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map(toUserDTO);
  },
});

export const createUser = defineAction({
  auth: "admin",
  schema: createUserSchema,
  handler: async (input): Promise<UserDTO> => {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existing) {
    throw new ActionError("That username is already taken.", "CONFLICT");
  }

  const email = input.email || null;
  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      throw new ActionError("That email is already in use by another account.", "CONFLICT", {
        email: ["That email is already in use by another account."],
      });
    }
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      email,
      role: input.role,
      passwordHash: hashPassword(input.password),
    },
  });

  return toUserDTO(user);
  },
});

export const updateUser = defineAction({
  auth: "admin",
  schema: updateUserSchema,
  handler: async (input): Promise<UserDTO> => {
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

  const email = input.email || null;
  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      throw new ActionError("That email is already in use by another account.", "CONFLICT", {
        email: ["That email is already in use by another account."],
      });
    }
  }

  const user = await prisma.user.update({
    where: { id: input.id },
    data: {
      name: input.name,
      username: input.username,
      email,
      role: input.role,
      ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
    },
  });

  return toUserDTO(user);
  },
});

export const deleteUser = defineAction({
  auth: "admin",
  schema: deleteUserSchema,
  handler: async (input): Promise<{ id: string }> => {
    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("User not found.", "NOT_FOUND");

    await prisma.user.delete({ where: { id: input.id } });
    return { id: input.id };
  },
});

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchIcon, UsersIcon } from "lucide-react";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserDTO } from "@/server/actions/users";

const ROLE_LABEL: Record<UserDTO["role"], string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

function matchesSearch(user: UserDTO, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return (
    user.name.toLowerCase().includes(needle) ||
    user.username.toLowerCase().includes(needle) ||
    ROLE_LABEL[user.role].toLowerCase().includes(needle)
  );
}

export function UsersTable() {
  const { data: users, isLoading, isError } = useUsers();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => matchesSearch(user, search));
  }, [users, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, username or role…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ps-8"
          />
        </div>
        <UserFormDialog mode="create" />
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            Couldn&apos;t load users.
          </p>
        ) : !users?.length ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <UsersIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No users yet.</p>
          </div>
        ) : !filteredUsers.length ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No users match &quot;{search}&quot;.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <UserFormDialog mode="edit" user={user} />
                      <DeleteConfirmButton
                        title="Delete this user?"
                        description={`"${user.name}" will be permanently removed.`}
                        isPending={deleteUser.isPending}
                        onConfirm={() =>
                          deleteUser.mutate(
                            { id: user.id },
                            { onError: (error) => toast.error(error.message) },
                          )
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import {
  AdminPageHeader,
  DataTable,
  StatusBadge,
  Pagination,
  Modal,
  SearchInput,
} from "@/components/admin/AdminUI";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  assignableRolesForActor,
  canAssignRole,
  hasPermission,
} from "@/lib/rbac/permissions";
import { Eye, ShieldCheck, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";

function RoleSelect({
  user: u,
  actorRole,
  onChange,
  disabled,
}: {
  user: { id: string; role: string };
  actorRole: string;
  onChange: (role: string) => void;
  disabled?: boolean;
}) {
  const options = assignableRolesForActor(actorRole, u.role);
  const canEdit = options.length > 0 && !disabled;

  if (!canEdit) {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--admin-fg)" }}>
        {u.role}
      </span>
    );
  }

  return (
    <select
      value={u.role}
      onChange={(e) => {
        const next = e.target.value;
        const check = canAssignRole(actorRole, u.role, next);
        if (!check.allowed) {
          toast.error(check.reason ?? "Cannot assign this role");
          return;
        }
        onChange(next);
      }}
      className="admin-input text-xs w-auto py-1"
    >
      {options.map((r) => (
        <option key={r} value={r}>
          {r.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

export default function AdminCustomersPage() {
  const { user: actor } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const canWrite = actor ? hasPermission(actor.role, "customers:write") : false;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      toast.success("Customer updated");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update");
    },
  });

  const customers = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  const columns = [
    {
      key: "name",
      label: "Customer",
      render: (u: any) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--admin-fg)" }}>
            {u.firstName} {u.lastName}
          </p>
          <p className="text-xs admin-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (u: any) =>
        canWrite ? (
          <RoleSelect
            user={u}
            actorRole={actor!.role}
            disabled={u.id === actor?.id}
            onChange={(role) => updateMutation.mutate({ id: u.id, data: { role } })}
          />
        ) : (
          <span className="text-xs font-medium" style={{ color: "var(--admin-fg)" }}>
            {u.role}
          </span>
        ),
    },
    {
      key: "isEmailVerified",
      label: "Verified",
      render: (u: any) => (
        <StatusBadge status={u.isEmailVerified ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (u: any) => (
        <StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "orders",
      label: "Orders",
      render: (u: any) => <span>{u._count?.orders || 0}</span>,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (u: any) => (
        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24",
      render: (u: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            title="View customer"
            onClick={() => setSelected(u)}
            className="admin-icon-btn"
          >
            <Eye size={14} strokeWidth={1.5} />
          </button>
          {canWrite && u.id !== actor?.id && (
            <button
              type="button"
              onClick={() =>
                updateMutation.mutate({
                  id: u.id,
                  data: { isActive: !u.isActive },
                })
              }
              className="admin-icon-btn"
              title={u.isActive ? "Deactivate" : "Activate"}
            >
              {u.isActive ? (
                <ShieldOff size={14} strokeWidth={1.5} />
              ) : (
                <ShieldCheck size={14} strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        subtitle={`${pagination?.total || 0} registered customers`}
      />
      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name or email..."
        />
      </div>
      <DataTable
        columns={columns}
        data={customers}
        loading={isLoading}
        emptyText="No customers found"
      />
      <Pagination
        page={page}
        pages={pagination?.pages || 1}
        onChange={setPage}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Customer Details"
        size="md"
      >
        {selected && actor && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 flex items-center justify-center text-2xl border"
                style={{
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-fg)",
                }}
              >
                {selected.firstName.charAt(0)}
                {selected.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--admin-fg)" }}>
                  {selected.firstName} {selected.lastName}
                </p>
                <p className="text-sm admin-muted">{selected.email}</p>
                <StatusBadge
                  status={selected.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </div>
            </div>
            <div
              className="grid grid-cols-2 gap-4 text-sm border-t pt-4"
              style={{ borderColor: "var(--admin-border)" }}
            >
              <div>
                <p className="admin-muted text-xs mb-1">Role</p>
                {canWrite && selected.id !== actor.id ? (
                  <RoleSelect
                    user={selected}
                    actorRole={actor.role}
                    onChange={(role) => {
                      updateMutation.mutate(
                        { id: selected.id, data: { role } },
                        { onSuccess: () => setSelected({ ...selected, role }) },
                      );
                    }}
                  />
                ) : (
                  <p style={{ color: "var(--admin-fg)" }}>{selected.role}</p>
                )}
              </div>
              <div>
                <p className="admin-muted text-xs mb-1">Orders</p>
                <p style={{ color: "var(--admin-fg)" }}>
                  {selected._count?.orders || 0}
                </p>
              </div>
              <div>
                <p className="admin-muted text-xs mb-1">Email Verified</p>
                <p style={{ color: "var(--admin-fg)" }}>
                  {selected.isEmailVerified ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="admin-muted text-xs mb-1">Joined</p>
                <p style={{ color: "var(--admin-fg)" }}>
                  {new Date(selected.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {canWrite && selected.id !== actor.id && (
              <div
                className="flex gap-3 pt-2 border-t"
                style={{ borderColor: "var(--admin-border)" }}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected.id,
                      data: { isActive: !selected.isActive },
                    })
                  }
                  disabled={updateMutation.isPending}
                  className="admin-btn-outline text-xs"
                >
                  {selected.isActive
                    ? "Deactivate Account"
                    : "Activate Account"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

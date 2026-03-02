'use client';

import { useForm } from "@tanstack/react-form";
import { useSession } from "next-auth/react";
import { Input } from "@/components/base/input/input";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { IconNotification } from "@/components/application/notifications/notifications";

type InvestorProfile = {
  id: string;
  external_code: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  risk_level_id: number | null;
  risk_point: number | null;
  sid: string | null;
  investor_type_id: string;
};

interface ProfileTabProps {
  investor: InvestorProfile;
}

export function ProfileTab({ investor }: ProfileTabProps) {
  const utils = trpc.useUtils();
  const { data: session } = useSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const updateMutation = trpc.investors.updateProfile.useMutation({
    onSuccess: () => {
      if (investor) {
        utils.investors.get.invalidate({ id: investor.id });
        utils.investors.list.invalidate();
      }
    },
  });

  const form = useForm({
    defaultValues: {
      external_code: investor.external_code ?? "",
      first_name: investor.first_name ?? "",
      middle_name: investor.middle_name ?? "",
      last_name: investor.last_name ?? "",
      email: investor.email ?? "",
      phone_number: investor.phone_number ?? "",
      risk_level_id: investor.risk_level_id != null ? String(investor.risk_level_id) : "",
      risk_point: investor.risk_point != null ? String(investor.risk_point) : "",
      sid: investor.sid ?? "",
      investor_type_id: investor.investor_type_id,
      reason: "",
    },
    onSubmit: async ({ value }) => {
      if (!userId) return;

      await updateMutation.mutateAsync({
        id: investor.id,
        requestedBy: userId,
        reason: value.reason || undefined,
        data: {
          external_code: value.external_code || null,
          first_name: value.first_name,
          middle_name: value.middle_name || null,
          last_name: value.last_name || null,
          email: value.email || null,
          phone_number: value.phone_number || null,
          risk_level_id: value.risk_level_id ? Number(value.risk_level_id) : null,
          risk_point: value.risk_point ? Number(value.risk_point) : null,
          sid: value.sid || null,
          investor_type_id: value.investor_type_id,
        },
      });

      toast.custom((t) => (
        <IconNotification
          title="Successfully updated profile"
          description="Your changes have been saved and your profile is live. Your team can make edits."
          confirmLabel="View changes"
          color="success"
          onClose={() => toast.dismiss(t)}
          onConfirm={() => toast.dismiss(t)}
        />
      ));
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="ID" value={investor.id} isDisabled />

        <form.Field name="external_code">
          {(field) => (
            <Input
              label="External Code"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="first_name">
          {(field) => (
            <Input
              label="First Name"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="middle_name">
          {(field) => (
            <Input
              label="Middle Name"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="last_name">
          {(field) => (
            <Input
              label="Last Name"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <Input
              label="Email"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="phone_number">
          {(field) => (
            <Input
              label="Phone Number"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="risk_level_id">
          {(field) => (
            <Input
              label="Risk Level ID"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="risk_point">
          {(field) => (
            <Input
              label="Risk Point"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="sid">
          {(field) => (
            <Input
              label="SID"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <form.Field name="investor_type_id">
          {(field) => (
            <Input
              label="Investor Type ID"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="reason">
        {(field) => (
          <Input
            label="Reason for change"
            value={field.state.value}
            onChange={field.handleChange}
          />
        )}
      </form.Field>

      <button
        type="submit"
        className="rounded-lg bg-brand-primary_alt px-4 py-2 text-sm font-medium text-brand-secondary disabled:opacity-60"
        disabled={!form.state.canSubmit || form.state.isSubmitting || !userId}
      >
        {form.state.isSubmitting ? "Submitting..." : "Submit for approval"}
      </button>
    </form>
  );
}

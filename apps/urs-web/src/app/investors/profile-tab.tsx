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
  version: number;
  investor_addresses?: {
    id: number;
    address_type_id: string;
    province_id: string;
    city_id: string;
    district_id: string;
    subdistrict_id: string;
    postal_code: string;
    address: string;
    address_line_2: string | null;
  }[];
  investor_heirs?: {
    id: number;
    name: string;
    relation_id: string;
  }[];
  investor_individuals?: {
    birth_date: string;
    birth_place: string;
    mother_name: string;
    gender_id: string;
    education_id: string;
    marital_id: string;
    nationality_id: string;
    job_id: string;
    job_category_id: string;
    job_role_id: string;
    tax_number: string;
    tax_effective_date: string;
    card_type_id: string;
    card_number: string;
    income_id: string;
    income_source_id: string;
    is_employee: boolean;
  } | null;
  investor_corporates?: {
    tax_number: string;
    reg_date: string;
    siup: string;
    tdp_number: string;
    tdp_reg_date: string;
    skd_reg_date: string;
    establish_date: string;
    phone_number: string;
    fax_number: string;
    corporate_legal_id: string;
  } | null;
  investor_banks?: {
    id: number;
    bank_id: number;
    bank_branch_id: number | null;
    account_number: string;
    account_name: string;
    is_active: boolean;
    is_primary: boolean;
  }[];
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

      // clear journal query
      utils.investors.journals.invalidate({ investorId: investor.id });

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
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Main profile</h3>
        <span className="text-xs text-tertiary">Version {investor.version}</span>
      </div>

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

      <div className="space-y-4 pt-4 border-t border-secondary">
        <h3 className="text-sm font-semibold text-primary">Addresses</h3>
        {investor.investor_addresses && investor.investor_addresses.length > 0 ? (
          <ul className="space-y-2 text-sm text-tertiary">
            {investor.investor_addresses.map((addr) => (
              <li key={addr.id} className="rounded-lg border border-secondary px-3 py-2">
                <div className="font-medium text-primary">{addr.address}</div>
                {addr.address_line_2 && <div>{addr.address_line_2}</div>}
                <div className="text-xs">
                  {addr.subdistrict_id}, {addr.district_id}, {addr.city_id}, {addr.province_id}{" "}
                  {addr.postal_code}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-tertiary">No addresses recorded.</p>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-secondary">
        <h3 className="text-sm font-semibold text-primary">Heirs</h3>
        {investor.investor_heirs && investor.investor_heirs.length > 0 ? (
          <ul className="space-y-1 text-sm text-tertiary">
            {investor.investor_heirs.map((heir) => (
              <li key={heir.id}>
                <span className="font-medium text-primary">{heir.name}</span>{" "}
                <span className="text-xs text-tertiary">({heir.relation_id})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-tertiary">No heirs recorded.</p>
        )}
      </div>

      {investor.investor_type_id === "I" && (
        <div className="space-y-4 pt-4 border-t border-secondary">
          <h3 className="text-sm font-semibold text-primary">Individual details</h3>
          {investor.investor_individuals ? (
            <dl className="grid grid-cols-1 gap-3 text-sm text-tertiary md:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-quaternary">Birth</dt>
                <dd>
                  {investor.investor_individuals.birth_place},{" "}
                  {new Date(investor.investor_individuals.birth_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Mother's Name</dt>
                <dd>{investor.investor_individuals.mother_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Tax Number</dt>
                <dd>{investor.investor_individuals.tax_number}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Card</dt>
                <dd>
                  {investor.investor_individuals.card_type_id} ·{" "}
                  {investor.investor_individuals.card_number}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-tertiary">No individual details recorded.</p>
          )}
        </div>
      )}

      {investor.investor_type_id !== "I" && (
        <div className="space-y-4 pt-4 border-t border-secondary">
          <h3 className="text-sm font-semibold text-primary">Corporate details</h3>
          {investor.investor_corporates ? (
            <dl className="grid grid-cols-1 gap-3 text-sm text-tertiary md:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-quaternary">Tax Number</dt>
                <dd>{investor.investor_corporates.tax_number}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Establish Date</dt>
                <dd>
                  {new Date(investor.investor_corporates.establish_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Phone</dt>
                <dd>{investor.investor_corporates.phone_number}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-quaternary">Legal Type</dt>
                <dd>{investor.investor_corporates.corporate_legal_id}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-tertiary">No corporate details recorded.</p>
          )}
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-secondary">
        <h3 className="text-sm font-semibold text-primary">Bank accounts</h3>
        {investor.investor_banks && investor.investor_banks.length > 0 ? (
          <ul className="space-y-2 text-sm text-tertiary">
            {investor.investor_banks.map((bank) => (
              <li key={bank.id} className="rounded-lg border border-secondary px-3 py-2">
                <div className="font-medium text-primary">
                  {bank.account_name} · {bank.account_number}
                </div>
                <div className="text-xs">
                  Bank #{bank.bank_id}
                  {bank.bank_branch_id && <> · Branch #{bank.bank_branch_id}</>}
                </div>
                <div className="text-xs">
                  {bank.is_primary ? "Primary" : "Secondary"} ·{" "}
                  {bank.is_active ? "Active" : "Inactive"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-tertiary">No bank accounts recorded.</p>
        )}
      </div>
    </form>
  );
}

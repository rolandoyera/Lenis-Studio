"use client";

import { Percent } from "lucide-react";
import { Controller } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { DataField } from "@/components/ui/data-field";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import type { Organization } from "@/lib/types";

import { TIMEZONE_OPTIONS } from "./company-constants";
import { type ComboItem, SearchSelect } from "./search-select";
import {
  EditableCardHeader,
  LABEL_CLASS,
  type SectionDialogChildProps,
} from "./section-dialog";

const TIMEZONE_ITEMS: ComboItem[] = TIMEZONE_OPTIONS.map((tz) => ({
  code: tz,
  name: tz,
}));

/** Keep only digits and a single decimal point (e.g. a pasted "15%" → "15"). */
function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
}

/** Keep only digits (whole numbers, e.g. expiration days). */
const sanitizeInteger = (value: string): string => value.replace(/\D/g, "");

export function SettingsCard({
  org,
  onEdit,
}: {
  org: Organization;
  onEdit: () => void;
}) {
  const s = org.settings;
  return (
    <Card variant="panel">
      <EditableCardHeader title="Company Settings" onEdit={onEdit} />

      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-6">
          <DataField label="Timezone" empty="Not Set">
            {s?.timezone}
          </DataField>
          <DataField label="Proposal Expiration" empty="Not Set">
            {typeof s?.proposalExpirationDays === "number"
              ? `${s.proposalExpirationDays} days`
              : null}
          </DataField>
        </div>
        <div className="space-y-6">
          <DataField label="Default Markup" empty="Not Set">
            {typeof s?.defaultMarkupPercent === "number"
              ? `${s.defaultMarkupPercent}%`
              : null}
          </DataField>
          <DataField label="Default Tax Rate" empty="Not Set">
            {typeof s?.defaultTaxRate === "number"
              ? `${s.defaultTaxRate}%`
              : null}
          </DataField>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsFields({
  control,
  container,
}: SectionDialogChildProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Controller
        control={control}
        name="timezone"
        render={({ field }) => (
          <Field className="flex flex-col gap-1.5">
            <Label className={LABEL_CLASS}>Timezone</Label>
            <SearchSelect
              items={TIMEZONE_ITEMS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select timezone..."
              searchPlaceholder="Search timezones..."
              emptyText="No timezone found."
              container={container}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="defaultMarkupPercent"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}
          >
            <Label className={LABEL_CLASS}>Default Markup</Label>
            <InputGroup>
              <InputGroupInput
                {...field}
                inputMode="decimal"
                placeholder="e.g. 15"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(sanitizeDecimal(e.target.value))
                }
              />
              <InputGroupAddon align="inline-end">
                <Percent />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="defaultTaxRate"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}
          >
            <Label className={LABEL_CLASS}>Default Tax Rate</Label>
            <InputGroup>
              <InputGroupInput
                {...field}
                inputMode="decimal"
                placeholder="e.g. 8.25"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(sanitizeDecimal(e.target.value))
                }
              />
              <InputGroupAddon align="inline-end">
                <Percent />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="proposalExpirationDays"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}
          >
            <Label className={LABEL_CLASS}>Proposal Expiration (days)</Label>
            <Input
              {...field}
              inputMode="numeric"
              placeholder="e.g. 30"
              aria-invalid={fieldState.invalid}
              onChange={(e) => field.onChange(sanitizeInteger(e.target.value))}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

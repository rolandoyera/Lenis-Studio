"use client";

import { Percent } from "lucide-react";
import { Controller } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="pt-0">
      <EditableCardHeader
        title="Settings"
        description="Defaults applied to proposals, pricing, and localization."
        onEdit={onEdit}
      />

      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <Label className="mb-1 text-muted-foreground text-xs">
              Timezone
            </Label>
            {s?.timezone ? (
              <p>{s?.timezone}</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="mb-1 text-muted-foreground text-xs">
              Proposal Expiration
            </Label>
            {typeof s?.proposalExpirationDays === "number" ? (
              <p>{s?.proposalExpirationDays} days</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <Label className="mb-1 text-muted-foreground text-xs">
              Default Markup
            </Label>
            {typeof s?.defaultMarkupPercent === "number" ? (
              <p>{s.defaultMarkupPercent}%</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="mb-1 text-muted-foreground text-xs">
              Default Tax Rate
            </Label>
            {typeof s?.defaultTaxRate === "number" ? (
              <p>{s.defaultTaxRate}%</p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
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

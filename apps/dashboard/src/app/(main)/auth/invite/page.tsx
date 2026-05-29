"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { XIcon } from "lucide-react";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const inviteFormSchema = z
  .object({
    fullName: z.string().min(1, "Please enter your name.").max(100),
    location: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type InviteFormData = z.infer<typeof inviteFormSchema>;

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      fullName: "",
      location: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!email) {
      setIsVerifying(false);
      return;
    }

    const verifyInvite = async () => {
      try {
        const docRef = doc(db, "users", email.trim().toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === "Pending") {
          const data = docSnap.data();
          setPendingData(data);
          setIsValid(true);
          reset({
            fullName: data.fullName || "",
            location: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (e) {
        console.error("Verification error:", e);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyInvite();
  }, [email, reset]);

  const onSubmit = async (data: InviteFormData) => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      const emailKey = email.trim().toLowerCase();

      // 1. Create user in Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(
        auth,
        emailKey,
        data.password,
      );

      // 2. Create permanent active user document keyed by UID
      await setDoc(doc(db, "users", userCred.user.uid), {
        fullName: data.fullName.trim(),
        email: emailKey,
        role: pendingData?.role || "Contributor",
        location: data.location?.trim() || "",
        phone: data.phone?.trim() || "",
        status: "Active",
        joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
        lastActive: Date.now(),
      });

      // 3. Delete temporary invitation document keyed by email
      await deleteDoc(doc(db, "users", emailKey));

      toast.success("Account created and activated successfully!");
      router.push("/dashboard");
    } catch (e: any) {
      console.error("Setup error:", e);
      let errorMsg = "Failed to create account. Please try again.";
      if (e.code === "auth/email-already-in-use") {
        errorMsg = "An account with this email address already exists.";
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex h-[40vh] w-full items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase animate-pulse">
            Verifying Invitation
          </p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] text-center">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <XIcon className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl">Invalid or Expired Invite</h1>
          <p className="text-muted-foreground text-sm">
            This invitation link has expired, is invalid, or has already been used. Please contact your administrator.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="space-y-2 text-center">
        <h1 className="font-medium text-3xl">Set up your account</h1>
        <p className="text-muted-foreground text-sm leading-snug">
          Welcome, <span className="font-medium text-foreground">{pendingData?.fullName}</span>! Please complete your details to activate your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full Name */}
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-fullName">Full Name</FieldLabel>
              <Input
                {...field}
                id="invite-fullName"
                placeholder="John Doe"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Location */}
        <Controller
          control={control}
          name="location"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-location">Location (Optional)</FieldLabel>
              <Input
                {...field}
                id="invite-location"
                placeholder="San Francisco, CA"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Phone */}
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-phone">Phone Number (Optional)</FieldLabel>
              <Input
                {...field}
                id="invite-phone"
                placeholder="+1 (555) 000-0000"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-password">Password</FieldLabel>
              <Input
                {...field}
                id="invite-password"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-confirmPassword">Confirm Password</FieldLabel>
              <Input
                {...field}
                id="invite-confirmPassword"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button className="w-full mt-2" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account & Activate"}
        </Button>
      </form>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[40vh] w-full items-center justify-center">
          <div className="relative size-10">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      }>
      <InviteContent />
    </Suspense>
  );
}

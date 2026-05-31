"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast.success("Password reset email sent!");
      setIsSent(true);
    } catch (error: any) {
      console.error("Password recovery error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          We have sent a secure link to your email to reset your password. Please check your inbox and spam folder.
        </p>
        <Button asChild className="w-full mt-4">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? "Sending email..." : "Send Password Reset Link"}
      </Button>
      <p className="text-center text-muted-foreground text-xs mt-2">
        Remembered your password?{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
}

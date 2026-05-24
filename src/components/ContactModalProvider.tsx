"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Button from "./ui/Button";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Input from "./ui/Input";

type Ctx = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const ContactModalContext = createContext<Ctx | null>(null);

export const useContactModal = () => {
  const ctx = useContext(ContactModalContext);
  if (!ctx)
    throw new Error("useContactModal must be used within ContactModalProvider");
  return ctx;
};

export default function ContactModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const openFn = useCallback(() => setOpen(true), []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const value = useMemo(
    () => ({ open: openFn, close, toggle }),
    [openFn, close, toggle],
  );

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      {open && <ContactModal onClose={close} />}
    </ContactModalContext.Provider>
  );
}

/* -------------------- Modal -------------------- */

const ContactSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10, // at least 10 digits
      "Enter a valid phone number",
    ),
  email: z.string().email("Enter a valid email"),
  company: z.string().optional(),
  ts: z.number().optional(),
});
type ContactValues = z.infer<typeof ContactSchema>;

function ContactModal({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      ts: Date.now(),
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const closeTimer = React.useRef<number | null>(null);

  // clean up timer if modal unmounts/closes early
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const onSubmit = async (data: ContactValues) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      reset();
      setSent(true);
      closeTimer.current = window.setTimeout(() => {
        setSent(false);
        onClose();
      }, 4800);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
      className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop with dark + blur */}
      <button
        aria-label="Close contact form"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className="relative mx-4 w-full md:max-w-[600px] rounded-lg bg-transparent shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-accent hover:text-white cursor-pointer z-10 transition-colors duration-200"
          aria-label="Close">
          ✕
        </button>

        {/* HEADER SECTION */}
        <div className="border-b border-border/20 px-8 pt-8 pb-5 bg-card rounded-t-lg">
          <h3
            id="contact-title"
            className="text-[28px] font-semibold tracking-[-0.012em] text-foreground">
            {sent ? "Message Sent" : "Let’s talk about your project"}
          </h3>
          <p className="text-[18px] text-foreground/75 mt-1 font-light">
            {sent
              ? "Thank you for reaching out."
              : "Share a few details and we’ll reach out shortly."}
          </p>
        </div>

        {/* MIDDLE CONTENT SECTION */}
        <div className="px-8 py-8 overflow-y-auto max-h-[60vh] flex-1 bg-card">
          {sent ? (
            <div className="py-8 text-center" aria-live="assertive">
              <CheckCircle2 className="mx-auto h-16 w-16 text-brand stroke-[1.5]" />
              <h2 className="mt-6 text-[22px] font-medium tracking-tight text-foreground">
                We’ll reach out shortly
              </h2>
              <p className="mt-2 text-[16px] text-foreground/80 max-w-sm mx-auto font-light leading-relaxed">
                Thanks—your message is on its way. We’ll contact you soon to
                discuss your vision.
              </p>
              <Button onClick={onClose} className="mt-8 w-full md:w-48 mx-auto">
                Close now
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-8">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                placeholder="Company"
                {...register("company")}
              />

              <input
                type="hidden"
                value={Date.now()}
                {...register("ts", { valueAsNumber: true })}
              />

              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Your Name"
                  aria-invalid={!!errors.name || undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="w-full"
                  {...register("name")}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone || undefined}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  placeholder="Contact number"
                  className="w-full"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  placeholder="Your Email"
                  className="w-full"
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-brand" aria-live="polite">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full md:w-80 disabled:opacity-60 mx-auto">
                {isSubmitting ? "Sending…" : "Submit"}
              </Button>
            </form>
          )}
        </div>

        {/* FOOTER SECTION */}
        <div className="border-t border-border/20 bg-ink-900 py-4 px-8 text-center rounded-b-lg">
          <p className="text-[16px] font-semibold tracking-wider text-muted">
            Sarvian Design Group
          </p>
          <p>
            <a
              href="tel:+19544444803"
              className="underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm font-mono text-[16px] text-accent"
              aria-label="Call Sarvian Design Group at 954-444-4803">
              954-444-4803
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

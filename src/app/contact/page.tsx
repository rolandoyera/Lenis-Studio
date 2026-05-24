"use client";

import { useState } from "react";
import styles from "./contact.module.css";

import Container from "@/components/ui/Container";

import Main from "@/components/ui/Main";
import Display from "@/components/ui/Display";
type Scope = "Residential" | "Hospitality" | "Cultural" | "Furniture" | "Other";

interface FormState {
  name: string;
  email: string;
  location: string;
  scope: Scope;
  brief: string;
}

const SCOPES: Scope[] = ["Residential", "Hospitality", "Cultural", "Furniture", "Other"];

const EMPTY: FormState = {
  name: "",
  email: "",
  location: "",
  scope: "Residential",
  brief: "",
};

/* ─── Sub-components ────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </span>
      {children}
    </label>
  );
}

/* ─── Success state ─────────────────────────────────────── */
function SuccessView({ onReset }: { onReset: () => void }) {
  return (
    <section className={styles.successSection}>
      <div className={styles.successInner}>
        <Eyebrow>Sent</Eyebrow>
        <h1 className={styles.successHeading}>
          Thank you. We&rsquo;ll write back within the week.
        </h1>
        <p className={styles.successBody}>
          We read every brief that comes through. If the project is a good fit,
          you&rsquo;ll hear from Mira or Daniel; if not, we&rsquo;ll send a
          short list of studios we admire who might be.
        </p>
        <button className={styles.btnSecondary} onClick={onReset}>
          Send another
        </button>
      </div>
    </section>
  );
}

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  function update<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      // Replace with your real server action or API route.
      // e.g. await submitBrief(form);
      await new Promise((r) => setTimeout(r, 600)); // simulate latency
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <SuccessView
        onReset={() => {
          setSent(false);
          setForm(EMPTY);
        }}
      />
    );
  }
  return (
    <Main className="mt-20">
      <Container>
        <section className={styles.section}>
          <div>
            {/* ── Page header ── */}
            <div className={styles.pageHeader}>
              <Eyebrow>Begin a project</Eyebrow>

              <Display>Tell us about the space.</Display>
            </div>

            {/* ── Two-column layout ── */}
            <div className={styles.layout}>
              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className={styles.form}
                noValidate
              >
                <div className={styles.row2}>
                  <Field label="Your name" required>
                    <input
                      className={styles.input}
                      placeholder="Full name"
                      value={form.name}
                      onChange={update("name")}
                      required
                      disabled={pending}
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="you@somewhere.com"
                      value={form.email}
                      onChange={update("email")}
                      required
                      disabled={pending}
                    />
                  </Field>
                </div>

                <Field label="Project location">
                  <input
                    className={styles.input}
                    placeholder="City, country"
                    value={form.location}
                    onChange={update("location")}
                    disabled={pending}
                  />
                </Field>

                <Field label="Scope">
                  <div className={styles.chips}>
                    {SCOPES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.chip} ${form.scope === s ? styles.chipActive : ""
                          }`}
                        onClick={() => setForm((prev) => ({ ...prev, scope: s }))}
                        disabled={pending}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="The brief">
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    placeholder="A paragraph or a list. Whichever feels truer."
                    value={form.brief}
                    onChange={update("brief")}
                    disabled={pending}
                  />
                </Field>

                <div className={styles.formFooter}>
                  <span className={styles.mono}>We respond within a week.</span>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={pending}
                  >
                    {pending ? "Sending\u2026" : "Send the brief"}
                    {!pending && <span className={styles.arr}>↗</span>}
                  </button>
                </div>
              </form>

              {/* Aside */}
              <aside className={styles.aside}>
                <div className={styles.asideBlock}>
                  <Eyebrow>The studio</Eyebrow>
                  <div className={styles.asideText}>
                    <p>hello@sarviandg.com</p>
                    <p>+1 (212) 555 0142</p>
                  </div>
                </div>

                <div className={styles.asideBlock}>
                  <Eyebrow>Press</Eyebrow>
                  <p className={styles.asideText}>press@sarvian.studio</p>
                </div>
              </aside>
            </div>
          </div>
        </section>



      </Container>
    </Main>
  );
}

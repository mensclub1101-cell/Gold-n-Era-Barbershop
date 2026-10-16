"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";

export const inputClass =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-ink";

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// ActionForm submits in a transition, which useFormStatus can't see.
const PendingContext = createContext(false);

export function SubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const status = useFormStatus();
  const pending = useContext(PendingContext) || status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-2 disabled:opacity-60 ${className}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

// A form wired to a server action that returns { error } or { notice }.
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.notice) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  // Submit through onSubmit rather than the action prop: React resets forms
  // after an action prop runs, which would wipe what people typed on an error.
  // The action prop stays as the no-JS fallback.
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className={className}
    >
      <PendingContext value={isPending}>{children}</PendingContext>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.notice && (
        <p role="status" className="rounded-xl bg-paper-2 px-4 py-3 text-sm text-ink">
          {state.notice}
        </p>
      )}
    </form>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-paper-2 px-3 py-2 text-xs">{url}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            window.prompt("Copy this link:", url);
          }
        }}
        className="shrink-0 rounded-full border border-ink px-3 py-1.5 text-xs font-semibold transition hover:bg-ink hover:text-paper"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

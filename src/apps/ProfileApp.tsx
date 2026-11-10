import { useEffect, useState } from "react";
import { initialsOf } from "../lib/utils";
import { useApp } from "../state/app-state";
import { Button, Field, TextInput } from "../components/ui";

export function ProfileApp() {
  const { profile, updateProfile } = useApp();
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const dirty =
    draft.name !== profile.name ||
    draft.tagline !== profile.tagline ||
    draft.email !== profile.email;

  const save = () => {
    updateProfile({
      name: draft.name.trim() || "Guest",
      tagline: draft.tagline.trim(),
      email: draft.email.trim(),
    });
  };

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto">
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-semibold text-white shadow-lg shadow-indigo-500/25">
            {initialsOf(draft.name || "Guest")}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {draft.name || "Guest"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {draft.tagline || "Add a tagline below."}
            </p>
          </div>
        </div>

        <Field label="Name" hint="Used for the greeting on the dashboard.">
          {({ id }) => (
            <TextInput
              id={id}
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Your name"
              maxLength={60}
            />
          )}
        </Field>

        <Field label="Tagline" hint="Shown under your name in the sidebar.">
          {({ id }) => (
            <TextInput
              id={id}
              value={draft.tagline}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, tagline: event.target.value }))
              }
              placeholder="Make space for what matters."
              maxLength={160}
            />
          )}
        </Field>

        <Field label="Email" hint="Optional — only stored on this device.">
          {({ id }) => (
            <TextInput
              id={id}
              type="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="you@example.com"
              maxLength={120}
            />
          )}
        </Field>

        <Button variant="primary" icon="check" onClick={save} disabled={!dirty}>
          Save profile
        </Button>
      </div>
    </div>
  );
}

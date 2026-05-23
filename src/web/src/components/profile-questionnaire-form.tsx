import type { CSSProperties } from "react";
import type { ProfileFormValues } from "../lib/profileQuestionnaire";

type Props = {
  values: ProfileFormValues;
  onChange: <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K]
  ) => void;
  theme?: "dark" | "light";
  title?: string;
  description?: string;
};

const LIST_FIELDS = [
  {
    key: "practiceAreas",
    label: "Practice areas",
    placeholder: "moving image, installation, performance"
  },
  {
    key: "workingLanguages",
    label: "Working languages",
    placeholder: "English, Italian"
  },
  {
    key: "strategicGoals",
    label: "Strategic goals",
    placeholder: "museum commissions, residencies"
  },
  {
    key: "collaborationInterests",
    label: "Collaboration interests",
    placeholder: "curators, institutions, producers"
  }
] as const;

function palette(theme: "dark" | "light") {
  return theme === "dark"
    ? {
        text: "#e8e0d8",
        muted: "#888",
        label: "#777",
        border: "#2a2a2a",
        accent: "#7d1f1f"
      }
    : {
        text: "#1c1917",
        muted: "#57534e",
        label: "#78716c",
        border: "#d6d3d1",
        accent: "#7d1f1f"
      };
}

function fieldStyle(theme: "dark" | "light"): CSSProperties {
  const colors = palette(theme);
  return {
    border: `1px solid ${colors.border}`,
    color: colors.text,
    caretColor: colors.accent
  };
}

function bindFocusBorder(
  event: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
  theme: "dark" | "light",
  active: boolean
) {
  event.target.style.borderColor = active
    ? palette(theme).accent
    : palette(theme).border;
}

export function ProfileQuestionnaireForm({
  values,
  onChange,
  theme = "light",
  title,
  description
}: Props) {
  const colors = palette(theme);
  const style = fieldStyle(theme);

  return (
    <div className="space-y-5">
      {title ? (
        <h2 className="font-serif text-4xl leading-tight">{title}</h2>
      ) : null}
      {description ? (
        <p className="max-w-2xl text-sm" style={{ color: colors.muted }}>
          {description}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {[
          {
            key: "displayName",
            label: "Display name",
            placeholder: "How you appear publicly"
          },
          { key: "location", label: "Location", placeholder: "City, country" },
          {
            key: "website",
            label: "Website",
            placeholder: "https://your-site.com"
          },
          {
            key: "professionalFocus",
            label: "Professional focus",
            placeholder: "What kind of practice or programme defines your work?"
          }
        ].map((field) => (
          <label key={field.key} className="block space-y-1.5">
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: colors.label }}
            >
              {field.label}
            </span>
            <input
              type="text"
              value={values[field.key as keyof ProfileFormValues]}
              onChange={(event) =>
                onChange(
                  field.key as keyof ProfileFormValues,
                  event.target.value as never
                )
              }
              placeholder={field.placeholder}
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
              style={style}
              onFocus={(event) => bindFocusBorder(event, theme, true)}
              onBlur={(event) => bindFocusBorder(event, theme, false)}
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: colors.label }}
        >
          Bio
        </span>
        <textarea
          rows={4}
          value={values.bio}
          onChange={(event) => onChange("bio", event.target.value)}
          placeholder="A short description of your practice or organisation"
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
          style={style}
          onFocus={(event) => bindFocusBorder(event, theme, true)}
          onBlur={(event) => bindFocusBorder(event, theme, false)}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        {LIST_FIELDS.map((field) => (
          <label key={field.key} className="block space-y-1.5">
            <span
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: colors.label }}
            >
              {field.label}
            </span>
            <input
              type="text"
              value={values[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
              style={style}
              onFocus={(event) => bindFocusBorder(event, theme, true)}
              onBlur={(event) => bindFocusBorder(event, theme, false)}
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: colors.label }}
        >
          Privacy mode
        </span>
        <select
          value={values.privacyMode}
          onChange={(event) =>
            onChange(
              "privacyMode",
              event.target.value as Props["values"]["privacyMode"]
            )
          }
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none transition-colors"
          style={{ ...style, caretColor: undefined }}
          onFocus={(event) => bindFocusBorder(event, theme, true)}
          onBlur={(event) => bindFocusBorder(event, theme, false)}
        >
          <option value="private">Private</option>
          <option value="contacts">Contacts</option>
          <option value="public">Public</option>
        </select>
      </label>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { ProfileQuestionnaireForm } from "../components/profile-questionnaire-form";
import { api } from "../lib/api";
import {
  createEmptyProfileForm,
  profileFormFromStatus,
  profilePayloadFromForm
} from "../lib/profileQuestionnaire";

type OnboardingStatus = {
  onboarding_completed: boolean;
  role: string;
  plan: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  professional_focus: string | null;
  practice_areas: string[];
  working_languages: string[];
  strategic_goals: string[];
  collaboration_interests: string[];
  privacy_mode: "private" | "contacts" | "public";
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api.get<OnboardingStatus>("/api/onboarding/status")
  });
  const [values, setValues] = useState(createEmptyProfileForm);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!status.data) return;
    setValues(profileFormFromStatus(status.data));
  }, [status.data]);

  const save = useMutation({
    mutationFn: () =>
      api.patch<OnboardingStatus>(
        "/api/onboarding/profile",
        profilePayloadFromForm(values)
      ),
    onSuccess: async (nextStatus) => {
      setNotice("Profile questionnaire updated.");
      setValues(profileFormFromStatus(nextStatus));
      await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    }
  });

  function handleChange(key: keyof typeof values, value: string) {
    setNotice("");
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Profile Intelligence
          </p>
          <h1 className="font-serif text-4xl">Profile questionnaire</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Keep your request workspace aligned with your practice, languages,
            goals, and privacy settings.
          </p>
        </div>
        <div className="flex gap-4 text-sm underline">
          <Link to="/artworks">Catalog</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/opportunities">Opportunities</Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-2xl">Workspace</h2>
          <div className="space-y-3 text-sm text-stone-600">
            <p>
              Role:{" "}
              <span className="font-medium text-stone-900">
                {status.data ? titleCase(status.data.role) : "Loading"}
              </span>
            </p>
            <p>
              Plan:{" "}
              <span className="font-medium text-stone-900">
                {status.data ? titleCase(status.data.plan) : "Loading"}
              </span>
            </p>
            <p>
              Onboarding:{" "}
              <span className="font-medium text-stone-900">
                {status.data?.onboarding_completed ? "Completed" : "Pending"}
              </span>
            </p>
          </div>
          <p className="text-sm text-stone-600">
            Requests and deterministic drafts use this context as structured
            studio memory when the request input is incomplete.
          </p>
        </aside>

        <div className="space-y-5 border border-stone-200 bg-white p-6">
          <ProfileQuestionnaireForm
            description="Comma-separated lists are stored as structured profile data and reused by request drafting."
            onChange={handleChange}
            values={values}
          />
          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
          {save.error ? (
            <p className="text-sm text-red-700">{save.error.message}</p>
          ) : null}
          <div className="flex gap-3">
            <Button onClick={() => save.mutate()} type="button">
              Save profile
            </Button>
            <Button
              className="bg-white text-stone-900"
              onClick={() =>
                setValues(
                  status.data
                    ? profileFormFromStatus(status.data)
                    : createEmptyProfileForm()
                )
              }
              type="button"
            >
              Reset changes
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

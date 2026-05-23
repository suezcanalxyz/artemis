import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../lib/api";
import { authStore } from "../lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [errorMessage, setErrorMessage] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      setErrorMessage("");
      const result = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { email: string; onboardingCompleted?: boolean };
      }>(`/api/auth/${mode}`, values);
      authStore.set(result);
      const needsOnboarding =
        mode === "register" || result.user?.onboardingCompleted === false;
      await navigate({ to: needsOnboarding ? "/onboarding" : "/" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed"
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6">
      <div className="grid w-full gap-8 border border-stone-200 bg-white p-8 md:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Artemis
          </p>
          <h1 className="font-serif text-5xl leading-none">
            Catalog your practice with custody intact.
          </h1>
          <p className="max-w-xl text-sm text-stone-600">
            A minimal workspace for artists documenting works, media, and
            metadata without platform noise.
          </p>
        </section>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex gap-2 text-sm">
            <button
              className="underline"
              type="button"
              onClick={() => setMode("register")}
            >
              Sign up
            </button>
            <button
              className="underline"
              type="button"
              onClick={() => setMode("login")}
            >
              Log in
            </button>
          </div>
          <label className="block space-y-1">
            <span className="text-sm">Email</span>
            <Input type="email" {...form.register("email")} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm">Password</span>
            <Input type="password" {...form.register("password")} />
          </label>
          {errorMessage ? (
            <p className="text-sm text-red-700">{errorMessage}</p>
          ) : null}
          <Button type="submit">
            {mode === "register" ? "Create account" : "Enter workspace"}
          </Button>
        </form>
      </div>
    </main>
  );
}

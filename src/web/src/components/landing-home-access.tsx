import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMagnetic } from "../lib/landing-hooks";

const FG = "#f0ede8";
const ACCENT = "#7d1f1f";

export function LandingHomeAccess() {
  const navigate = useNavigate();
  const enterRef = useMagnetic<HTMLButtonElement>(0.3);
  const [code, setCode] = useState("");
  const [whitelistStatus, setWhitelistStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [whitelistError, setWhitelistError] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useEffect(() => {
    const nextCode = new URLSearchParams(window.location.search).get("code");
    if (nextCode) setCode(nextCode.toUpperCase());
  }, []);

  async function handleWhitelist(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setWhitelistStatus("loading");
    setWhitelistError("");
    try {
      const res = await fetch("/api/landing/whitelist/use", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });
      const json = (await res.json()) as {
        data: { inviteToken: string } | null;
        error?: { message: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid code");
      sessionStorage.setItem("inviteToken", json.data!.inviteToken);
      await navigate({ to: "/login" });
    } catch (error) {
      setWhitelistStatus("error");
      setWhitelistError(
        error instanceof Error ? error.message : "Invalid or already used code"
      );
    }
  }

  async function handleWaitlist(event: FormEvent) {
    event.preventDefault();
    setEmailStatus("loading");
    try {
      const res = await fetch("/api/landing/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      if (!res.ok) throw new Error("Could not join waitlist");
      setEmailStatus("success");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div
      className="grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      style={{ animation: "fade-up 0.8s cubic-bezier(0.2,0,0,1) 1s both" }}
    >
      <section className="border border-white/10 bg-white/[0.02] p-6 md:p-7">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-white/45">
          Enter whitelist
        </p>
        <h2 className="mb-3 font-serif text-3xl text-white">
          Try the beta now.
        </h2>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/60">
          If you already have an invite code, enter it here and continue to the
          registration screen.
        </p>
        <form
          onSubmit={handleWhitelist}
          className="flex flex-wrap gap-3"
          noValidate
        >
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            spellCheck={false}
            autoCorrect="off"
            className="font-mono text-sm uppercase tracking-[0.25em] outline-none"
            style={{
              minWidth: 220,
              flex: "1 1 220px",
              border: `1px solid ${FG}18`,
              padding: "12px 16px",
              color: FG,
              background: "transparent"
            }}
          />
          <button
            ref={enterRef}
            type="submit"
            disabled={whitelistStatus === "loading" || !code.trim()}
            className="font-mono text-[11px] uppercase tracking-[0.2em] disabled:opacity-40"
            style={{
              background: ACCENT,
              border: `1px solid ${ACCENT}`,
              padding: "12px 22px",
              color: FG
            }}
          >
            {whitelistStatus === "loading" ? "Checking..." : "Enter ->"}
          </button>
        </form>
        {whitelistError ? (
          <p className="mt-3 font-mono text-[10px] tracking-[0.15em] text-red-300">
            {whitelistError}
          </p>
        ) : null}
      </section>

      <section className="border border-white/10 bg-white/[0.02] p-6 md:p-7">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-white/45">
          Join waitlist
        </p>
        <h2 className="mb-3 font-serif text-3xl text-white">
          Ask for the next opening.
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-white/60">
          Join the waitlist and we will let you know as soon as a place opens.
        </p>
        {emailStatus === "success" ? (
          <p className="text-sm leading-relaxed text-white/70">
            Thank you. You are on the list and we have sent a confirmation
            email.
          </p>
        ) : showWaitlist ? (
          <form onSubmit={handleWaitlist} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="submit"
              disabled={emailStatus === "loading" || !email.trim()}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 underline underline-offset-4 disabled:opacity-40"
            >
              {emailStatus === "loading" ? "Sending..." : "Join waitlist ->"}
            </button>
            {emailStatus === "error" ? (
              <p className="text-sm text-red-300">
                Something went wrong. Please try again.
              </p>
            ) : null}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowWaitlist(true)}
            className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/45 underline underline-offset-4 transition-colors hover:text-white/80"
          >
            Open waitlist form
          </button>
        )}
      </section>
    </div>
  );
}

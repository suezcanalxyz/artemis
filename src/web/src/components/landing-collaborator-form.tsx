import { type FormEvent, useState } from "react";
import { Link } from "@tanstack/react-router";

type Status = "idle" | "loading" | "success" | "error";

export function LandingCollaboratorForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [background, setBackground] = useState("");
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorText("");
    try {
      const res = await fetch("/api/landing/collaborate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, background, message })
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message: string } };
        throw new Error(json.error?.message ?? "Something went wrong");
      }
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorText(
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="border border-stone-200 p-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
          Received
        </p>
        <p className="mb-3 font-serif text-2xl">Thank you for reaching out.</p>
        <p className="mb-6 text-sm leading-relaxed text-stone-600">
          We have received your message and will be in touch soon. Check your
          inbox for a confirmation note.
        </p>
        <Link
          to="/"
          className="text-sm text-stone-600 underline transition-colors hover:text-stone-900"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 border border-stone-200 bg-white p-8"
    >
      <h2 className="font-serif text-2xl">Get in touch</h2>

      <label className="block space-y-1">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-stone-500">
          Name
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-stone-500">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          className="w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-stone-500">
          Your practice
        </span>
        <textarea
          value={background}
          onChange={(event) => setBackground(event.target.value)}
          placeholder="Briefly describe your work or artistic background"
          rows={3}
          className="w-full resize-none border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-mono uppercase tracking-[0.15em] text-stone-500">
          How you would like to collaborate
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What kind of collaboration interests you? What can you bring?"
          rows={4}
          className="w-full resize-none border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900"
        />
      </label>

      {errorText ? <p className="text-sm text-red-700">{errorText}</p> : null}

      <button
        type="submit"
        disabled={status === "loading" || !name || !email}
        className="w-full border border-stone-900 bg-stone-900 px-6 py-2.5 text-sm text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-40"
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

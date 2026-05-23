import type { ReactNode } from "react";
import { useReveal, useTilt } from "../lib/landing-hooks";

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-mono inline-block"
      style={{
        fontSize: 9,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        border: "1px solid var(--accent)",
        color: "var(--accent)",
        padding: "3px 10px",
        marginRight: 8
      }}
    >
      {children}
    </span>
  );
}

type Props = {
  delay?: number;
  index: string;
  title: string;
  paragraphs: string[];
  pills?: readonly string[];
  children?: ReactNode;
};

export function LandingProjectCard({
  delay = 0,
  index,
  title,
  paragraphs,
  pills,
  children
}: Props) {
  const reveal = useReveal<HTMLDivElement>();
  const tilt = useTilt<HTMLDivElement>(6);

  return (
    <div
      ref={reveal}
      className={`reveal border border-stone-200 bg-white p-8 md:p-12 d${delay + 1}`}
      style={{ marginBottom: 1 }}
    >
      <div ref={tilt} className="card-3d">
        <p
          className="font-mono mb-6"
          style={{
            fontSize: 9,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "var(--accent)"
          }}
        >
          {index}
        </p>
        <h2 className="mb-5 font-serif text-3xl leading-tight text-[var(--fg)] md:text-4xl">
          {title}
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-stone-600">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {pills?.length ? (
          <div className="mt-6">
            {pills.map((pill) => (
              <Pill key={pill}>{pill}</Pill>
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

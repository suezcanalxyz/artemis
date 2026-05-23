import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`border border-stone-900 bg-stone-900 px-4 py-2 text-sm text-stone-50 transition hover:bg-stone-700 disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

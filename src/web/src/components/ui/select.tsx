import type { SelectHTMLAttributes } from "react";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-stone-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-stone-900 ${props.className ?? ""}`}
    />
  );
}

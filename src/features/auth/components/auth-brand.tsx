import Link from "next/link";

export function AuthBrand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/signin"
      className={`group inline-flex items-center gap-3 transition-transform duration-150 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 ${className}`}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-400/30">
        <svg
          aria-hidden
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:rotate-6"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Aura<span className="text-emerald-600">Shield</span>
          </span>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-600/20">
            v2.0
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Zero-Trust Identity Platform
        </span>
      </div>
    </Link>
  );
}
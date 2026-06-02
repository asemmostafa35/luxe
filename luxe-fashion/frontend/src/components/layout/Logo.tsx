"use client";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-brand-900 dark:text-white ${className}`}
      aria-label="ZANE"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M3 4.25H14.25L6.1 13.75H15"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13.9" cy="4.25" r="1.2" className="fill-[#b79b63]" />
      </svg>

      <span className="font-serif text-xl md:text-2xl font-light tracking-[0.32em] uppercase leading-none">
        ZANE
      </span>
    </span>
  );
}

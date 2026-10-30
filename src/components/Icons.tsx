function Icon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="flex-none">
      <rect x="8" y="8" width="38" height="38" rx="8" fill="var(--line)" />
      <rect x="54" y="8" width="38" height="38" rx="8" fill="var(--line)" />
      <rect x="8" y="54" width="38" height="38" rx="8" fill="var(--line)" />
      <rect x="54" y="54" width="38" height="38" rx="8" fill="var(--primary)" />
    </svg>
  );
}

export const ChevronLeftIcon =() => <Icon path="M15 19l-7-7 7-7" />;
export const ChevronRightIcon = () => <Icon path="M9 5l7 7-7 7" />;
export const CloseIcon = () => <Icon path="M6 6l12 12M18 6L6 18" size={22} />;
export const TrashIcon = () => <Icon path="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />;
export const CalendarIcon = () => <Icon path="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" size={22} />;
export const BoxIcon = () => <Icon path="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" size={22} />;
export const CartIcon = () => <Icon path="M3 4h2l2.5 12h10L20 8H6.5M9 20h.01M16 20h.01" size={22} />;
export const UserIcon = () => <Icon path="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8" size={22} />;

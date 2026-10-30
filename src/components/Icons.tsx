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

export const ChevronLeftIcon = () => <Icon path="M15 19l-7-7 7-7" />;
export const ChevronRightIcon = () => <Icon path="M9 5l7 7-7 7" />;
export const CloseIcon = () => <Icon path="M6 6l12 12M18 6L6 18" size={22} />;
export const TrashIcon = () => <Icon path="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />;
export const CalendarIcon = () => <Icon path="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" size={22} />;
export const BoxIcon = () => <Icon path="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" size={22} />;
export const CartIcon = () => <Icon path="M3 4h2l2.5 12h10L20 8H6.5M9 20h.01M16 20h.01" size={22} />;

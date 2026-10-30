export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="fixed left-4 right-4 top-4 z-[60] mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg"
    >
      <p className="flex-1 break-words text-sm font-medium text-red-700">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="text-xl leading-none text-red-500 hover:text-red-700"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) {
    return null;
  }

  return (
    <p className={`rounded-lg px-4 py-3 text-sm font-semibold ${ok ? "bg-green-50 text-green-800" : "bg-red-50 text-brand-red"}`}>
      {message}
    </p>
  );
}

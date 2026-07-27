export function DirectorFormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) {
    return null;
  }

  return <p className={`rounded-lg px-4 py-3 text-sm font-bold ${ok ? "bg-brand-beige text-brand-dark" : "bg-red-50 text-brand-red"}`}>{message}</p>;
}

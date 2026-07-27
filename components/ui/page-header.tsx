export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-brand-dark md:text-5xl">{title}</h1>
      {subtitle ? <p className="mt-4 text-lg leading-8 text-brand-muted">{subtitle}</p> : null}
    </div>
  );
}

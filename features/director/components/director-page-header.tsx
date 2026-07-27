export function DirectorPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <section>
      <p className="text-lg font-bold text-brand-red">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">{title}</h1>
      {description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-brand-muted">{description}</p> : null}
    </section>
  );
}

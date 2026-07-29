export function Logo() {
  const letters = "SkillCity".split("");

  return (
    <div className="group inline-flex items-center gap-2">
      <span className="sr-only">Next Gen SkillCity</span>
      <span aria-hidden="true" className="inline-flex items-center gap-2">
        <span className="skillcity-nextgen-mark relative inline-flex h-8 items-center overflow-hidden rounded-sm bg-brand-red px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white sm:h-9 sm:text-xs">
          Next Gen
        </span>
        <span className="inline-flex overflow-hidden text-3xl font-black uppercase leading-none tracking-normal">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={index < 5 ? "skillcity-letter text-brand-red" : "skillcity-letter text-brand-dark"}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              {letter}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}

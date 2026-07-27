export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-red text-xl font-black text-white">S</div>
      <div>
        <div className="text-xl font-black leading-none text-brand-dark">SkillCity</div>
        <div className="mt-1 text-xs font-bold uppercase tracking-normal text-brand-muted">AI University OS</div>
      </div>
    </div>
  );
}

export function Logo() {
  return (
    <div className="group inline-flex flex-col">
      <span className="text-2xl font-black uppercase leading-none tracking-normal sm:text-3xl">
        <span className="text-brand-gold transition duration-300 group-hover:text-brand-red">AIRA</span>{" "}
        <span className="text-brand-dark transition duration-300 group-hover:text-black">Skill City</span>
      </span>
      <span className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-muted">
        AI Research & Advancement
      </span>
    </div>
  );
}

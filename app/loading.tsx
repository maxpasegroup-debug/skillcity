export default function Loading() {
  return <main className="skillcity-shell-bg min-h-screen px-5 py-10" aria-busy="true" aria-label="Loading"><div className="mx-auto max-w-7xl animate-pulse space-y-6"><div className="h-8 w-48 rounded-lg bg-black/10" /><div className="h-16 max-w-xl rounded-lg bg-black/10" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-lg bg-black/10" />)}</div></div></main>;
}


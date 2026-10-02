export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Sports Fitness Tracker
      </h1>
      <p className="max-w-sm text-base text-zinc-600 dark:text-zinc-400">
        Coming soon. We&apos;re building something to help you track your
        training from your phone.
      </p>
    </main>
  );
}

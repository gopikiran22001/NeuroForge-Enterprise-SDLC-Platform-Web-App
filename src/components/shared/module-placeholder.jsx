import { Button } from "@/components/ui/button";

export function ModulePlaceholder({ title, description, icon: Icon, children }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-4 pb-6 border-b hairline">
        <div>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">{description}</p>
        </div>
      </header>

      <div className="mt-8 rounded-xl border hairline bg-surface p-10">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <Icon className="size-5" />
          </div>
          <h2 className="mt-4 font-display text-xl">Coming Soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The <span className="text-foreground">{title}</span> workspace is scaffolded and
            connected to the platform. Full screens will land in a future milestone alongside the
            broader delivery surface.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

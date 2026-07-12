import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/repositories")({
  head: () => ({
    meta: [
      { title: "Repositories · NeuroForge Nexus" },
      { name: "description", content: "Source repositories, branches and code ownership." },
    ],
  }),
  component: Repositories,
});
function Repositories() {
  return (
    <ModulePlaceholder
      title="Repositories"
      description="Source repositories, branches and code ownership."
      icon={GitBranch}
    />
  );
}

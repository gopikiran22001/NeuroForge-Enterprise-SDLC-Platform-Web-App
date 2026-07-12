import { createFileRoute } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments · NeuroForge Nexus" },
      { name: "description", content: "Environments, deploys and rollback history." },
    ],
  }),
  component: Deployments,
});
function Deployments() {
  return (
    <ModulePlaceholder
      title="Deployments"
      description="Environments, deploys and rollback history."
      icon={Server}
    />
  );
}

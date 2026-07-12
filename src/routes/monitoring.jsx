import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring · NeuroForge Nexus" },
      { name: "description", content: "Service health, SLOs and incident overview." },
    ],
  }),
  component: Monitoring,
});
function Monitoring() {
  return (
    <ModulePlaceholder
      title="Monitoring"
      description="Service health, SLOs and incident overview."
      icon={Activity}
    />
  );
}

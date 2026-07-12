import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Releases · NeuroForge Nexus" },
      { name: "description", content: "Release train, versioning and approvals." },
    ],
  }),
  component: Releases,
});
function Releases() {
  return (
    <ModulePlaceholder
      title="Releases"
      description="Release train, versioning and approvals."
      icon={Rocket}
    />
  );
}

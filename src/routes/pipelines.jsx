import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/pipelines")({
  head: () => ({
    meta: [
      { title: "Pipelines · NeuroForge Nexus" },
      { name: "description", content: "CI/CD pipelines, builds and quality gates." },
    ],
  }),
  component: Pipelines,
});
function Pipelines() {
  return (
    <ModulePlaceholder
      title="Pipelines"
      description="CI/CD pipelines, builds and quality gates."
      icon={Workflow}
    />
  );
}

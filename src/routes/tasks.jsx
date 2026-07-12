import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks · NeuroForge Nexus" },
      {
        name: "description",
        content: "Every task across the portfolio with owner, status and priority.",
      },
    ],
  }),
  component: Tasks,
});
function Tasks() {
  return (
    <ModulePlaceholder
      title="Tasks"
      description="Every task across the portfolio with owner, status and priority."
      icon={ListChecks}
    />
  );
}

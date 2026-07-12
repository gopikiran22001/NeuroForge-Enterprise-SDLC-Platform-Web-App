import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · NeuroForge Nexus" },
      {
        name: "description",
        content: "Portfolio, delivery and reliability reports for leadership.",
      },
    ],
  }),
  component: Reports,
});
function Reports() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Portfolio, delivery and reliability reports for leadership."
      icon={BarChart3}
    />
  );
}

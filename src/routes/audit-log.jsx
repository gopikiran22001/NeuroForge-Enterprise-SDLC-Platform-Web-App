import { createFileRoute } from "@tanstack/react-router";
import { FileClock } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
export const Route = createFileRoute("/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit log · NeuroForge Nexus" },
      { name: "description", content: "Immutable history of security and configuration events." },
    ],
  }),
  component: AuditLog,
});
function AuditLog() {
  return (
    <ModulePlaceholder
      title="Audit log"
      description="Immutable history of security and configuration events."
      icon={FileClock}
    />
  );
}

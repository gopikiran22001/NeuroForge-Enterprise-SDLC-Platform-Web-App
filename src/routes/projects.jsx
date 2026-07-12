import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects · NeuroForge Nexus" },
      {
        name: "description",
        content: "Portfolio of active projects across the engineering organization.",
      },
    ],
  }),
  component: () => <Outlet />,
});

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/repositories")({
  component: RepositoriesRedirect,
});

function RepositoriesRedirect() {
  return <Navigate to="/integrations" replace />;
}

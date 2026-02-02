import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Not found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

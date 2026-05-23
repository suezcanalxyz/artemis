import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect
} from "@tanstack/react-router";
import { authStore } from "./lib/auth";
import { queryClient } from "./lib/queryClient";
import { ArtworkDetailPage } from "./routes/artworks.$id";
import { DomainsPage } from "./routes/domains";
import { RegistrarGuidePage } from "./routes/guides.$registrar";
import { HomePage } from "./routes/index";
import { LoginPage } from "./routes/login";
import { OnboardingPage } from "./routes/onboarding";
import { OpportunitiesPage } from "./routes/opportunities";
import { ProfilePage } from "./routes/profile";
import { RequestDetailPage } from "./routes/requests.$id";
import { RequestsPage } from "./routes/requests";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Outlet />
    </div>
  )
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  beforeLoad: () => {
    if (!authStore.getAccess()) throw redirect({ to: "/login" });
  },
  component: OnboardingPage
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (!authStore.getAccess()) throw redirect({ to: "/login" });
    if (!authStore.isOnboardingCompleted())
      throw redirect({ to: "/onboarding" });
  },
  component: HomePage
});

function requireFullAuth() {
  if (!authStore.getAccess()) throw redirect({ to: "/login" });
  if (!authStore.isOnboardingCompleted()) throw redirect({ to: "/onboarding" });
}

const artworkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/artworks/$id",
  beforeLoad: requireFullAuth,
  component: ArtworkDetailPage
});

const domainsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/domains",
  beforeLoad: requireFullAuth,
  component: DomainsPage
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireFullAuth,
  component: ProfilePage
});

const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  beforeLoad: requireFullAuth,
  component: RequestsPage
});

const requestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests/$id",
  beforeLoad: requireFullAuth,
  component: RequestDetailPage
});

const opportunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities",
  beforeLoad: requireFullAuth,
  component: OpportunitiesPage
});

const guideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guides/$registrar",
  beforeLoad: requireFullAuth,
  component: RegistrarGuidePage
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  onboardingRoute,
  artworkRoute,
  domainsRoute,
  profileRoute,
  opportunitiesRoute,
  requestsRoute,
  requestDetailRoute,
  guideRoute
]);

export const router = createRouter({ routeTree, context: { queryClient } });

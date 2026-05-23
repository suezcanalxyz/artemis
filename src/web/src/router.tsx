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
import { LandingCollaboratePage } from "./routes/landing-collaborate";
import { LandingHomePage } from "./routes/landing-home";
import { LandingHowToUsePage } from "./routes/landing-how-to-use";
import { LandingProjectPage } from "./routes/landing-project";
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

// Public landing routes
const landingHomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (!authStore.getAccess()) return;
    if (authStore.isOnboardingCompleted()) throw redirect({ to: "/artworks" });
    throw redirect({ to: "/onboarding" });
  },
  component: LandingHomePage
});

const landingProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project",
  component: LandingProjectPage
});

const landingHowToUseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/how-to-use",
  component: LandingHowToUsePage
});

const landingCollaborateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/collaborate",
  component: LandingCollaboratePage
});

// Auth routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => {
    if (!authStore.getAccess()) return;
    if (authStore.isOnboardingCompleted()) throw redirect({ to: "/artworks" });
    throw redirect({ to: "/onboarding" });
  },
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

// App routes (require full auth)
function requireFullAuth() {
  if (!authStore.getAccess()) throw redirect({ to: "/login" });
  if (!authStore.isOnboardingCompleted()) throw redirect({ to: "/onboarding" });
}

const artworksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/artworks",
  beforeLoad: requireFullAuth,
  component: HomePage
});

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
  landingHomeRoute,
  landingProjectRoute,
  landingHowToUseRoute,
  landingCollaborateRoute,
  loginRoute,
  onboardingRoute,
  artworksRoute,
  artworkRoute,
  domainsRoute,
  profileRoute,
  opportunitiesRoute,
  requestsRoute,
  requestDetailRoute,
  guideRoute
]);

export const router = createRouter({ routeTree, context: { queryClient } });

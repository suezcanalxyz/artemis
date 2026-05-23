const accessKey = "artemis_access_token";
const refreshKey = "artemis_refresh_token";
const userKey = "artemis_user";

export type StoredUser = {
  email: string;
  id?: string;
  profileId?: string;
  onboardingCompleted?: boolean;
  role?: string;
  plan?: string;
};

export const authStore = {
  getAccess: () => localStorage.getItem(accessKey),
  getRefresh: () => localStorage.getItem(refreshKey),
  getUser: (): StoredUser | null => {
    const raw = localStorage.getItem(userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
  isOnboardingCompleted: () => {
    const user = authStore.getUser();
    return user?.onboardingCompleted === true;
  },
  set(tokens: { accessToken: string; refreshToken: string; user?: unknown }) {
    localStorage.setItem(accessKey, tokens.accessToken);
    localStorage.setItem(refreshKey, tokens.refreshToken);
    if (tokens.user) {
      localStorage.setItem(userKey, JSON.stringify(tokens.user));
    }
  },
  updateUser(patch: Partial<StoredUser>) {
    const current = authStore.getUser() ?? {};
    localStorage.setItem(userKey, JSON.stringify({ ...current, ...patch }));
  },
  clear() {
    localStorage.removeItem(accessKey);
    localStorage.removeItem(refreshKey);
    localStorage.removeItem(userKey);
  }
};

import "express";

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        host: string;
        mode: "control_plane" | "tenant";
        profileId?: string;
        domainId?: string;
        isCustomDomain?: boolean;
      };
    }
  }
}

export {};

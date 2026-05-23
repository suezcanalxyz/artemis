import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        profileId: string;
        email: string;
      };
    }
  }
}

export {};

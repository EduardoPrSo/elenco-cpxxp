import { Role } from "@/types/prisma";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      discordId: string;
    };
  }

  interface User {
    role: Role;
    discordId: string;
  }
}

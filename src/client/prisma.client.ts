import { PrismaClient } from "@prisma/client";
import { IAuthDbManager } from "../interfaces/db-manager.interface";
import { IUserRepository } from "../interfaces/user.repository.interface";
import { UserRepository } from "../repositories/user.repository";

class AuthDbManager implements IAuthDbManager {
  readonly userRepository: IUserRepository;
  private readonly prisma: PrismaClient;

  constructor(databaseUrl: string) {
    this.prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    this.userRepository = new UserRepository(this.prisma);
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

let instance: AuthDbManager | null = null;

/**
 * Returns a singleton IAuthDbManager.
 * Call once at application startup and reuse the returned instance.
 */
export function createAuthDbManager(databaseUrl: string): IAuthDbManager {
  if (!instance) {
    instance = new AuthDbManager(databaseUrl);
  }
  return instance;
}

/**
 * Resets the singleton — useful in tests.
 */
export function resetAuthDbManager(): void {
  instance = null;
}

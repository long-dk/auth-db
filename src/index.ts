// Public API — only import from this file, never from internal paths
export { createAuthDbManager, resetAuthDbManager } from "./client/prisma.client";
export type { IAuthDbManager } from "./interfaces/db-manager.interface";
export type {
  IUserRepository,
  CreateUserInput,
  UpdateUserInput,
} from "./interfaces/user.repository.interface";
export type { User } from "./interfaces/user.repository.interface";
export { Role } from "./interfaces/user.repository.interface";
export type { PaginatedResult, QueryOptions } from "./interfaces/base.interface";
